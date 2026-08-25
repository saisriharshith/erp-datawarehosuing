"""
ETL Pipeline Orchestrator
-------------------------
Main executable pipeline that coordinates:
1. Extraction from erp_source (or raw snapshot)
2. Transformation, cleansing & star-schema creation
3. 5-Dimension Data Quality validation
4. Loading & indexing into erp_warehouse
5. Generation of execution summary audit
"""

import os
import sys
import time
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from etl.extract import extract_data
from etl.transform import transform_data
from etl.validate import validate_data_quality
from etl.load import load_data

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
SOURCE_DB_NAME = os.getenv("SOURCE_DB_NAME", "erp_source")
WAREHOUSE_DB_NAME = os.getenv("WAREHOUSE_DB_NAME", "erp_warehouse")


def run_etl_pipeline(uri: str = MONGODB_URI, source_db: str = SOURCE_DB_NAME, warehouse_db: str = WAREHOUSE_DB_NAME) -> dict:
    """
    Executes the complete ETL and data quality pipeline.
    """
    start_time = time.time()
    print("=" * 70)
    print("STARTING ERP DATA WAREHOUSE ETL PIPELINE")
    print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Source DB:    {source_db}")
    print(f"Warehouse DB: {warehouse_db}")
    print("=" * 70)

    # 1. EXTRACT
    raw_data = extract_data(uri=uri, db_name=source_db)

    # 2. TRANSFORM
    transformed_data = transform_data(raw_data)

    # 3. VALIDATE
    quality_report = validate_data_quality(raw_data, transformed_data)

    # 4. LOAD
    load_data(transformed_data, quality_report, uri=uri, db_name=warehouse_db)

    elapsed_time = round(time.time() - start_time, 2)
    print("\n" + "=" * 70)
    print(f"ETL PIPELINE COMPLETED SUCCESSFULLY in {elapsed_time}s")
    print(f"  • Overall Data Quality Score: {quality_report['metrics']['overall_score']}%")
    print(f"  • Status: {quality_report['status']}")
    print("=" * 70 + "\n")

    return {
        "status": "success",
        "elapsed_seconds": elapsed_time,
        "quality_report": quality_report
    }


if __name__ == "__main__":
    run_etl_pipeline()
