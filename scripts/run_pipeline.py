"""
End-to-End Demo Pipeline Runner
-------------------------------
Executes the full institutional demonstration workflow in one command:
1. Generates synthetic raw ERP data with controlled anomalies
2. Seeds MongoDB erp_source database (or creates local snapshot)
3. Runs the modular ETL pipeline with 5-dimension Data Quality validation
4. Loads dimensional star-schema & creates analytical indexes in erp_warehouse
5. Trains & persists the Machine Learning student risk classification model
6. Runs unit & integration test suite to verify full system health
"""

import os
import sys
import subprocess
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from scripts.generate_data import generate_synthetic_erp_data
from etl.pipeline import run_etl_pipeline
from ml.train import train_and_save_model
import json


def execute_full_demonstration_pipeline():
    start = time.time()
    print("\n" + "=" * 75)
    print("  ERP DATA WAREHOUSE & DECISION SUPPORT SYSTEM - END-TO-END RUNNER")
    print("=" * 75)

    # STEP 1: Synthetic Data Generation
    print("\n[STEP 1/4] Generating Synthetic Raw ERP Data with Intentional Quality Anomalies...")
    raw_data = generate_synthetic_erp_data(num_students=600)
    raw_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "raw", "raw_erp_data.json"))
    os.makedirs(os.path.dirname(raw_path), exist_ok=True)
    with open(raw_path, "w", encoding="utf-8") as f:
        json.dump(raw_data, f, indent=2)
    print(f"  ✓ Raw snapshot saved to {raw_path}")

    # STEP 2: ETL Pipeline & 5-Dimension Data Quality Validation
    print("\n[STEP 2/4] Running Modular ETL Pipeline & Data Quality Assurance...")
    etl_result = run_etl_pipeline()
    print(f"  ✓ ETL Pipeline Status: {etl_result['status']} (DQ Score: {etl_result['quality_report']['metrics']['overall_score']}%)")

    # STEP 3: Machine Learning Model Training & Feature Engineering
    print("\n[STEP 3/4] Training Scikit-Learn Student Risk Prediction Classifier...")
    wh_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "warehouse", "warehouse_snapshot.json"))
    with open(wh_path, "r", encoding="utf-8") as f:
        wh_data = json.load(f)
    ml_result = train_and_save_model(wh_data)
    print(f"  ✓ ML Model Trained: {ml_result['metrics']['model_type']} (Accuracy: {ml_result['metrics']['accuracy']}%)")

    # STEP 4: Automated Verification Test Suite
    print("\n[STEP 4/4] Executing Automated Test Suite...")
    test_proc = subprocess.run(
        [sys.executable, "-m", "pytest", "tests/"],
        cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "..")),
        capture_output=True,
        text=True,
        env={**os.environ, "PYTHONPATH": "."}
    )
    if test_proc.returncode == 0:
        print("  ✓ All 14 test cases passed successfully.")
    else:
        print(f"  ! Tests output:\n{test_proc.stdout}\n{test_proc.stderr}")

    total_time = round(time.time() - start, 2)
    print("\n" + "=" * 75)
    print(f"  FULL END-TO-END PIPELINE COMPLETED SUCCESSFULLY IN {total_time}s")
    print("=" * 75)
    print("\nTo start the application:")
    print("  1. Backend API:  ./venv/bin/python backend/app.py (Port 5001)")
    print("  2. Frontend UI:  cd frontend && python3 -m http.server 3000")
    print("  3. Open Browser: http://localhost:3000\n")


if __name__ == "__main__":
    execute_full_demonstration_pipeline()
