"""
Database Seeding Utility for erp_source
---------------------------------------
Generates raw synthetic institutional ERP data and seeds the MongoDB `erp_source`
database. Creates collections and sets up base indexes.
"""

import os
import sys
from dotenv import load_dotenv
import pymongo
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

# Add parent directory to path to allow importing from scripts or packages
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from scripts.generate_data import generate_synthetic_erp_data

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
SOURCE_DB_NAME = os.getenv("SOURCE_DB_NAME", "erp_source")


def get_mongo_client(uri: str, timeout_ms: int = 5000) -> pymongo.MongoClient:
    """Creates a PyMongo client with a short timeout for health check."""
    return pymongo.MongoClient(uri, serverSelectionTimeoutMS=timeout_ms)


def seed_source_database(num_students: int = 600, drop_existing: bool = True):
    """
    Seeds the raw erp_source database with synthetic data.
    """
    print("=" * 60)
    print(f"CONNECTING TO MONGODB: {MONGODB_URI}")
    print(f"TARGET SOURCE DATABASE: {SOURCE_DB_NAME}")
    print("=" * 60)

    try:
        client = get_mongo_client(MONGODB_URI)
        client.admin.command("ping")
        print(" Connected to MongoDB successfully.\n")
    except (ConnectionFailure, ServerSelectionTimeoutError) as err:
        print(f"\n[ERROR] Unable to connect to MongoDB at '{MONGODB_URI}'.")
        print(f"Details: {err}")
        print("\nTIP: Ensure MongoDB is running locally (e.g. `brew services start mongodb-community` or `mongod`),")
        print("or configure a valid MongoDB Atlas MONGODB_URI in your .env file.")
        sys.exit(1)

    db = client[SOURCE_DB_NAME]

    if drop_existing:
        print(f"Dropping existing '{SOURCE_DB_NAME}' database collections...")
        for col_name in [
            "departments", "subjects", "faculty", "students", "admissions",
            "attendance", "examinations", "fees", "library"
        ]:
            db[col_name].drop()

    # Generate synthetic dataset
    data = generate_synthetic_erp_data(num_students=num_students)

    print("\nInserting generated collections into `erp_source`...")

    # Insert into collections
    col_mapping = {
        "departments": data["departments"],
        "subjects": data["subjects"],
        "faculty": data["faculty"],
        "students": data["students"],
        "admissions": data["admissions"],
        "attendance": data["attendance"],
        "examinations": data["examinations"],
        "fees": data["fees"],
        "library": data["library"]
    }

    inserted_counts = {}
    for col_name, documents in col_mapping.items():
        if documents:
            result = db[col_name].insert_many(documents)
            inserted_counts[col_name] = len(result.inserted_ids)
            print(f"  • Inserted {len(result.inserted_ids):>6} records into '{col_name}'")

    # Set up indexes on source collections
    print("\nCreating indexes on source collections...")
    db.students.create_index("raw_student_id")
    db.admissions.create_index("student_id")
    db.attendance.create_index([("student_id", pymongo.ASCENDING), ("subject_code", pymongo.ASCENDING)])
    db.examinations.create_index([("student_id", pymongo.ASCENDING), ("subject_code", pymongo.ASCENDING)])
    db.fees.create_index([("student_id", pymongo.ASCENDING), ("semester", pymongo.ASCENDING)])
    db.library.create_index("student_id")
    print(" Indexes created successfully.")

    print("\n" + "=" * 60)
    print("ERP SOURCE DATABASE SEEDING COMPLETE")
    print("=" * 60)
    for col, count in inserted_counts.items():
        print(f"  {col:<20}: {count} records")
    print("=" * 60)

    client.close()


if __name__ == "__main__":
    count = 600
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        count = int(sys.argv[1])
    seed_source_database(num_students=count)
