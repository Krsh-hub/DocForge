import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.services.numbering_service import get_current_financial_year, allocate_document_number
from app.services.template_service import get_docx_variables, infer_field_schema
from app.core.db import SessionLocal

client = TestClient(app)

def test_financial_year_calculation():
    from datetime import date
    fy_may = get_current_financial_year(date(2026, 5, 10))
    assert fy_may == "2026-27"
    fy_jan = get_current_financial_year(date(2027, 1, 15))
    assert fy_jan == "2026-27"

def test_templates_listed():
    response = client.get("/templates")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    names = [t["name"] for t in data]
    assert "Standard Mutual NDA" in names
    assert "Statement of Work (SOW)" in names

def test_clauses_library():
    response = client.get("/clauses")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5

def test_clients_and_projects():
    response = client.get("/clients")
    assert response.status_code == 200
    clients = response.json()
    assert len(clients) >= 1
    assert "Apex Global" in clients[0]["legal_name"]

def test_legacy_order_import_and_list():
    import uuid
    unique_doc_num = f"AKS/HIST/{uuid.uuid4().hex[:6].upper()}"
    # Import legacy order
    payload = {
        "type": "sow",
        "custom_doc_number": unique_doc_num,
        "client_id": 1,
        "project_name": "Legacy Web Platform",
        "effective_date": "2025-11-15",
        "status": "signed",
        "total_amount": 150000.00,
        "currency": "INR",
        "legacy_source": "Old Physical Records Book",
        "notes": "Original order signed in Q3 2025 before DocForge adoption",
        "milestones": [
            {
                "title": "Initial Architecture & Wireframes",
                "deliverable": "Design artifacts and system specification",
                "due_date": "2025-12-01",
                "amount": 50000.00
            },
            {
                "title": "Full Implementation",
                "deliverable": "Deployed web application",
                "due_date": "2026-01-15",
                "amount": 100000.00
            }
        ]
    }
    res = client.post("/documents/import-legacy-order", json=payload)
    assert res.status_code == 200
    doc = res.json()
    assert doc["doc_number"] == unique_doc_num
    assert doc["is_legacy"] is True
    assert doc["legacy_source"] == "Old Physical Records Book"

    # Verify query with legacy filter
    list_res = client.get("/documents?legacy_only=true")
    assert list_res.status_code == 200
    legacy_docs = list_res.json()
    assert any(d["doc_number"] == unique_doc_num for d in legacy_docs)

