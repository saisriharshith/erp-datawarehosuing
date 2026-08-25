"""
ETL Extract Module
------------------
Extracts raw operational datasets from MongoDB `erp_source` database collections
or raw JSON cache snapshots.
"""

import os
import json
try:
    import pymongo
    from pymongo.errors import PyMongoError
except ImportError:
    pymongo = None
    PyMongoError = Exception


def extract_from_mongodb(uri: str, db_name: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    Extracts all raw collections from MongoDB erp_source.
    """
    print(f"[ETL-EXTRACT] Connecting to MongoDB: {uri} (DB: {db_name})...")
    client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
    db = client[db_name]

    collections = [
        "departments", "subjects", "faculty", "students", "admissions",
        "attendance", "examinations", "fees", "library"
    ]

    extracted_data = {}
    total_records = 0

    for col in collections:
        try:
            cursor = db[col].find({}, {"_id": 0})
            docs = list(cursor)
            extracted_data[col] = docs
            total_records += len(docs)
            print(f"  [EXTRACTED] '{col}': {len(docs):>5} documents")
        except PyMongoError as e:
            print(f"  [WARN] Failed to extract from collection '{col}': {e}")
            extracted_data[col] = []

    client.close()
    print(f"[ETL-EXTRACT] Completed. Total raw documents extracted: {total_records}")
    return extracted_data


def extract_from_file_snapshot(filepath: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    Fallback extractor from saved raw JSON snapshot if database is unreachable.
    """
    print(f"[ETL-EXTRACT] Loading snapshot from file: {filepath}...")
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    total_records = sum(len(v) for v in data.values() if isinstance(v, list))
    print(f"[ETL-EXTRACT] Snapshot loaded. Total raw documents: {total_records}")
    return data


def extract_data(uri: str = "mongodb://localhost:27017", db_name: str = "erp_source") -> Dict[str, List[Dict[str, Any]]]:
    """
    Main extract entry point with automatic fallback to local snapshot.
    """
    try:
        client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=3000)
        client.admin.command("ping")
        client.close()
        return extract_from_mongodb(uri, db_name)
    except Exception as e:
        print(f"[ETL-EXTRACT] MongoDB not reachable ({e}). Falling back to local snapshot...")
        raw_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "raw", "raw_erp_data.json"))
        if not os.path.exists(raw_file):
            print("[ETL-EXTRACT] Raw snapshot not found. Generating fresh synthetic snapshot...")
            from scripts.generate_data import generate_synthetic_erp_data
            data = generate_synthetic_erp_data(600)
            os.makedirs(os.path.dirname(raw_file), exist_ok=True)
            with open(raw_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            return data
        return extract_from_file_snapshot(raw_file)


if __name__ == "__main__":
    raw_data = extract_data()
    print(f"Summary of extracted keys: {list(raw_data.keys())}")
