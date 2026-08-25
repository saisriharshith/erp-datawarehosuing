"""
Unit & Integration Tests for ETL & Data Quality Pipeline
--------------------------------------------------------
"""

import pytest
from scripts.generate_data import generate_synthetic_erp_data
from etl.transform import transform_data, normalize_department, parse_and_standardize_date
from etl.validate import validate_data_quality


def test_synthetic_data_generation():
    """Verify synthetic dataset generator produces expected collections and schema."""
    data = generate_synthetic_erp_data(num_students=100)
    assert "students" in data
    assert "attendance" in data
    assert "examinations" in data
    assert "fees" in data
    assert "library" in data
    assert len(data["students"]) >= 100
    assert len(data["departments"]) == 5


def test_department_normalization():
    """Verify department normalization handles messy real-world variations."""
    assert normalize_department("Computer Science")[0] == "DEPT_CSE"
    assert normalize_department("comp sci")[0] == "DEPT_CSE"
    assert normalize_department("ECE")[0] == "DEPT_ECE"
    assert normalize_department("mech dept")[0] == "DEPT_MECH"
    assert normalize_department("Civil Engg")[0] == "DEPT_CIVIL"
    assert normalize_department("AI & DS")[0] == "DEPT_AIDS"


def test_date_standardization():
    """Verify date parsing standardizes varied formats to ISO YYYY-MM-DD."""
    assert parse_and_standardize_date("2024-08-15") == "2024-08-15"
    assert parse_and_standardize_date("15/08/2024") == "2024-08-15"
    assert parse_and_standardize_date("08-15-2024") == "2024-08-15"


def test_etl_transform_and_validation():
    """Verify transform creates dimensions and facts, and validate computes 5-dimension scores."""
    raw = generate_synthetic_erp_data(num_students=100)
    transformed = transform_data(raw)
    
    dims = transformed["dimensions"]
    facts = transformed["facts"]

    assert "dim_students" in dims
    assert "dim_departments" in dims
    assert "fact_attendance" in facts
    assert "fact_examinations" in facts
    assert "fact_fees" in facts
    assert "fact_library" in facts

    report = validate_data_quality(raw, transformed)
    assert "metrics" in report
    metrics = report["metrics"]
    assert metrics["completeness"] >= 95.0
    assert metrics["validity"] >= 95.0
    assert metrics["consistency"] >= 95.0
    assert metrics["uniqueness"] >= 90.0
    assert metrics["referential_integrity"] >= 95.0
    assert metrics["overall_score"] >= 90.0
