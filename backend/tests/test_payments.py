import pytest
import uuid
from datetime import date
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_payment_lifecycle():
    # 1. Create a fresh test invoice
    inv_payload = {
        "client_id": 1,
        "issue_date": str(date.today()),
        "due_date": str(date.today()),
        "currency": "INR",
        "custom_doc_number": f"TEST-INV-{uuid.uuid4().hex[:8]}",

        "items": [
            {
                "description": "Milestone 1 Test Item",
                "sac_code": "998314",
                "quantity": 1,
                "unit": "nos",
                "rate": 100000.00,
                "discount": 0.00,
                "tax_rate": 18.00,
                "amount": 100000.00
            }
        ],
        "subtotal": 100000.00,
        "cgst": 9000.00,
        "sgst": 9000.00,
        "total": 118000.00,
        "status": "sent"
    }

    inv_res = client.post("/documents/invoice", json=inv_payload)
    assert inv_res.status_code == 200, inv_res.text
    inv_data = inv_res.json()
    invoice_id = inv_data["id"]

    # 2. Check initial summary
    sum_res = client.get(f"/invoices/{invoice_id}/summary")
    assert sum_res.status_code == 200
    summary = sum_res.json()
    assert float(summary["total"]) == 118000.00
    assert float(summary["amount_paid"]) == 0.00
    assert float(summary["balance_due"]) == 118000.00
    assert summary["payment_status"] == "unpaid"
    assert len(summary["payments"]) == 0

    # 3. Record a partial payment (e.g. ₹50,000 advance)
    pay1_payload = {
        "date": str(date.today()),
        "amount": 50000.00,
        "mode": "bank_transfer",
        "reference": "HDFC-UTR-998877",
        "notes": "Advance payment 50k"
    }
    p1_res = client.post(f"/invoices/{invoice_id}/payments", json=pay1_payload)
    assert p1_res.status_code == 200
    p1_data = p1_res.json()
    assert float(p1_data["amount"]) == 50000.00
    assert p1_data["reference"] == "HDFC-UTR-998877"

    # Verify status is now 'partial'
    sum_res2 = client.get(f"/invoices/{invoice_id}/summary")
    s2 = sum_res2.json()
    assert float(s2["amount_paid"]) == 50000.00
    assert float(s2["balance_due"]) == 68000.00
    assert s2["payment_status"] == "partial"
    assert len(s2["payments"]) == 1

    # 4. Record remaining payment (₹68,000)
    pay2_payload = {
        "date": str(date.today()),
        "amount": 68000.00,
        "mode": "upi",
        "reference": "UPI-TXN-112233",
        "notes": "Final settlement"
    }
    p2_res = client.post(f"/invoices/{invoice_id}/payments", json=pay2_payload)
    assert p2_res.status_code == 200

    # Verify status is now 'paid'
    sum_res3 = client.get(f"/invoices/{invoice_id}/summary")
    s3 = sum_res3.json()
    assert float(s3["amount_paid"]) == 118000.00
    assert float(s3["balance_due"]) == 0.00
    assert s3["payment_status"] == "paid"
    assert len(s3["payments"]) == 2

    # 5. Check global ledger
    all_res = client.get("/payments")
    assert all_res.status_code == 200
    payments_list = all_res.json()
    assert any(p["reference"] == "HDFC-UTR-998877" for p in payments_list)
    assert any(p["reference"] == "UPI-TXN-112233" for p in payments_list)

    # 6. Check finance summary
    fin_res = client.get("/finance/summary")
    assert fin_res.status_code == 200
    fin_data = fin_res.json()
    assert float(fin_data["total_invoiced"]) >= 118000.00
    assert float(fin_data["total_collected"]) >= 118000.00

    # 7. Delete the second payment and verify revert to partial
    p2_id = p2_res.json()["id"]
    del_res = client.delete(f"/invoices/{invoice_id}/payments/{p2_id}")
    assert del_res.status_code == 200
    del_data = del_res.json()
    assert del_data["payment_status"] == "partial"
    assert float(del_data["amount_paid"]) == 50000.00
