"""
ETL Load Module
---------------
Performs deterministic, idempotent bulk upserts of dimensions, facts, data quality
reports, and KPI lineage metadata into the MongoDB `erp_warehouse` database.
"""

import os
import json
try:
    import pymongo
    from pymongo import UpdateOne
    from pymongo.errors import PyMongoError
except ImportError:
    pymongo = None
    UpdateOne = None
    PyMongoError = Exception

# Master KPI Lineage Metadata
KPI_LINEAGE_DEFINITIONS = [
    {
        "_id": "kpi_total_students",
        "metric_key": "total_students",
        "display_name": "Total Active Students",
        "category": "Enrollment",
        "source_collection": "erp_source.students, erp_source.admissions",
        "warehouse_collection": "erp_warehouse.dim_students",
        "calculation_logic": "COUNT(dim_students WHERE is_active = true)",
        "mongo_aggregation_pipeline": 'db.dim_students.aggregate([\n  { "$match": { "is_active": true } },\n  { "$group": { "_id": None, "total_students": { "$sum": 1 } } }\n])',
        "etl_transformations": [
            "Extracted from raw ERP admissions & student registries",
            "Deduplicated duplicate student enrollments by business student_id",
            "Imputed missing contact emails using student name patterns",
            "Standardized department synonyms into canonical department IDs"
        ]
    },
    {
        "_id": "kpi_average_attendance",
        "metric_key": "average_attendance",
        "display_name": "Average Student Attendance",
        "category": "Academics",
        "source_collection": "erp_source.attendance",
        "warehouse_collection": "erp_warehouse.fact_attendance",
        "calculation_logic": "AVG(attendance_percentage)",
        "mongo_aggregation_pipeline": 'db.fact_attendance.aggregate([\n  { "$group": {\n      "_id": "$department_id",\n      "avg_attendance": { "$avg": "$attendance_percentage" },\n      "total_sessions": { "$sum": "$total_classes" },\n      "attended_sessions": { "$sum": "$classes_attended" }\n  } },\n  { "$group": {\n      "_id": None,\n      "overall_institutional_avg": { "$avg": "$avg_attendance" }\n  } }\n])',
        "etl_transformations": [
            "Standardized diverse date formats (DD/MM/YYYY, MM-DD-YYYY) to ISO 8601",
            "Clamped out-of-range attendance records (> total classes or < 0)",
            "Derived categorical status: Adequate (>=75%), Shortage (60-74%), Critical (<60%)",
            "Referential integrity validation against dim_students and dim_subjects"
        ]
    },
    {
        "_id": "kpi_average_marks",
        "metric_key": "average_marks",
        "display_name": "Average Examination Score",
        "category": "Academics",
        "source_collection": "erp_source.examinations",
        "warehouse_collection": "erp_warehouse.fact_examinations",
        "calculation_logic": "AVG(total_marks = internal_marks + end_sem_marks)",
        "mongo_aggregation_pipeline": 'db.fact_examinations.aggregate([\n  { "$group": {\n      "_id": None,\n      "avg_score": { "$avg": "$total_marks" },\n      "avg_gpa": { "$avg": "$grade_point" },\n      "pass_rate": { "$avg": { "$cond": ["$is_passed", 1.0, 0.0] } }\n  } }\n])',
        "etl_transformations": [
            "Sanitized internal marks to [0, 30] and end-semester marks to [0, 70]",
            "Derived 10-point grade scale and letter grades (O, A+, A, B+, B, C, F)",
            "Enforced cross-field consistency rule: total_marks == internal + end_sem",
            "Flagged subject pass/fail status based on institutional minimum thresholds"
        ]
    },
    {
        "_id": "kpi_fee_collection_rate",
        "metric_key": "fee_collection_rate",
        "display_name": "Fee Collection Efficiency Rate",
        "category": "Finance",
        "source_collection": "erp_source.fees",
        "warehouse_collection": "erp_warehouse.fact_fees",
        "calculation_logic": "SUM(total_paid) / SUM(total_due) * 100",
        "mongo_aggregation_pipeline": 'db.fact_fees.aggregate([\n  { "$group": {\n      "_id": None,\n      "total_billed": { "$sum": "$total_due" },\n      "total_collected": { "$sum": "$total_paid" },\n      "total_arrears": { "$sum": "$outstanding_balance" }\n  } },\n  { "$project": {\n      "collection_efficiency_pct": {\n        "$multiply": [{ "$divide": ["$total_collected", "$total_billed"] }, 100]\n      }\n  } }\n])',
        "etl_transformations": [
            "Deduplicated duplicate payment transaction receipts",
            "Calculated outstanding balances: MAX(0, total_due - total_paid)",
            "Normalized payment status codes (PAID, PARTIAL, OVERDUE)",
            "Standardized transaction timestamps for longitudinal trend analysis"
        ]
    },
    {
        "_id": "kpi_high_risk_students",
        "metric_key": "high_risk_students",
        "display_name": "High-Risk Student Alert Count",
        "category": "Decision Support",
        "source_collection": "Aggregated facts: attendance, exams, fees, library",
        "warehouse_collection": "erp_warehouse.risk_predictions",
        "calculation_logic": "COUNT(risk_predictions WHERE risk_level = 'HIGH')",
        "mongo_aggregation_pipeline": 'db.risk_predictions.aggregate([\n  { "$match": { "risk_level": "HIGH" } },\n  { "$group": {\n      "_id": "$department_id",\n      "flagged_advisees": { "$sum": 1 }\n  } },\n  { "$sort": { "flagged_advisees": -1 } }\n])',
        "etl_transformations": [
            "Engineered predictive features: attendance %, internal avg, backlog counts",
            "Processed through trained Scikit-learn Random Forest Classifier",
            "Extracted top contributing risk factors for actionable faculty intervention"
        ]
    },
    {
        "_id": "kpi_data_quality_score",
        "metric_key": "data_quality_score",
        "display_name": "Composite Data Quality Health Score",
        "category": "Governance",
        "source_collection": "All raw erp_source collections",
        "warehouse_collection": "erp_warehouse.data_quality_reports",
        "calculation_logic": "0.25*Completeness + 0.25*Validity + 0.20*Consistency + 0.15*Uniqueness + 0.15*RefIntegrity",
        "mongo_aggregation_pipeline": 'db.data_quality_reports.find({}, {\n  "metrics": 1,\n  "issues_detected": 1,\n  "run_timestamp": 1\n}).sort({ "run_timestamp": -1 }).limit(1)',
        "etl_transformations": [
            "Evaluated 5 enterprise data quality dimensions across entire pipeline",
            "Recorded full audit logs of sanitized anomalies and rejected documents"
        ]
    }
]


def load_to_mongodb(
    uri: str,
    db_name: str,
    transformed_data: Dict[str, Any],
    quality_report: Dict[str, Any]
) -> bool:
    """
    Performs idempotent bulk upserts into MongoDB erp_warehouse.
    """
    print(f"[ETL-LOAD] Connecting to MongoDB Warehouse: {uri} (DB: {db_name})...")
    client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
    db = client[db_name]

    dims = transformed_data["dimensions"]
    facts = transformed_data["facts"]

    # 1. Upsert Dimensions
    for col_name, records in dims.items():
        if not records:
            continue
        operations = [
            UpdateOne({"_id": doc["_id"]}, {"$set": doc}, upsert=True)
            for doc in records
        ]
        result = db[col_name].bulk_write(operations, ordered=False)
        print(f"  [LOADED] {col_name:<18}: {result.upserted_count + result.modified_count + result.matched_count} records upserted")

    # 2. Upsert Facts
    for col_name, records in facts.items():
        if not records:
            continue
        operations = [
            UpdateOne({"_id": doc["_id"]}, {"$set": doc}, upsert=True)
            for doc in records
        ]
        result = db[col_name].bulk_write(operations, ordered=False)
        print(f"  [LOADED] {col_name:<18}: {result.upserted_count + result.modified_count + result.matched_count} records upserted")

    # 3. Store Data Quality Report
    db.data_quality_reports.insert_one(quality_report)
    print(f"  [LOADED] data_quality_reports: Stored audit run '{quality_report['report_id']}'")

    # 4. Upsert KPI Lineage Metadata
    lineage_ops = [
        UpdateOne({"_id": kpi["_id"]}, {"$set": kpi}, upsert=True)
        for kpi in KPI_LINEAGE_DEFINITIONS
    ]
    db.kpi_lineage_definitions.bulk_write(lineage_ops)
    print(f"  [LOADED] kpi_lineage_definitions: {len(KPI_LINEAGE_DEFINITIONS)} KPI definitions synced")

    # 5. Create Warehouse Indexes for ultra-fast aggregation queries
    print("[ETL-LOAD] Creating analytical warehouse indexes...")
    db.dim_students.create_index("department_id")
    db.dim_students.create_index("current_semester")
    db.fact_attendance.create_index([("student_id", pymongo.ASCENDING), ("department_id", pymongo.ASCENDING)])
    db.fact_attendance.create_index("semester")
    db.fact_examinations.create_index([("student_id", pymongo.ASCENDING), ("department_id", pymongo.ASCENDING)])
    db.fact_examinations.create_index("grade_letter")
    db.fact_fees.create_index([("student_id", pymongo.ASCENDING), ("status", pymongo.ASCENDING)])
    db.fact_library.create_index("student_id")
    db.data_quality_reports.create_index([("run_timestamp", pymongo.DESCENDING)])

    client.close()
    print("[ETL-LOAD] MongoDB Warehouse loading and indexing complete.")
    return True


def save_warehouse_snapshot(
    transformed_data: Dict[str, Any],
    quality_report: Dict[str, Any],
    filepath: str
):
    """
    Saves clean warehouse dataset snapshot to JSON for local fallback or testing.
    """
    snapshot = {
        "dimensions": transformed_data["dimensions"],
        "facts": transformed_data["facts"],
        "data_quality_reports": [quality_report],
        "kpi_lineage_definitions": KPI_LINEAGE_DEFINITIONS
    }
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, indent=2)
    print(f"[ETL-LOAD] Saved local warehouse snapshot to {filepath}")


def load_data(
    transformed_data: Dict[str, Any],
    quality_report: Dict[str, Any],
    uri: str = "mongodb://localhost:27017",
    db_name: str = "erp_warehouse"
) -> bool:
    """
    Main loader entry point with resilient fallback to JSON file snapshot.
    """
    snapshot_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "warehouse", "warehouse_snapshot.json"))
    save_warehouse_snapshot(transformed_data, quality_report, snapshot_path)

    try:
        client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=3000)
        client.admin.command("ping")
        client.close()
        return load_to_mongodb(uri, db_name, transformed_data, quality_report)
    except Exception as e:
        print(f"[ETL-LOAD] MongoDB not reachable ({e}). Warehouse snapshot saved locally.")
        return True
