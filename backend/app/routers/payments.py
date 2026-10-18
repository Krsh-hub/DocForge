"""Payment and Financial Tracking Router for DocForge"""
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.db import get_db
from app.models.all_models import (
    Invoice, Payment, Document, Client, AuditLog, PaymentStatus
)
from app.schemas.all_schemas import (
    PaymentCreate, PaymentResponse, InvoicePaymentSummary,
    FinanceSummaryResponse, ClientFinancialBalance
)
from app.routers.deps import get_current_user_optional, require_manager_or_admin

router = APIRouter(tags=["Payments & Finance"])


def _recalculate_invoice_status(invoice: Invoice, doc: Document) -> None:
    """Helper to recalculate amount_paid and payment_status on invoice and parent document."""
    total_paid = sum(Decimal(str(p.amount)) for p in invoice.payments)
    invoice.amount_paid = total_paid

    if total_paid >= Decimal(str(invoice.total)):
        invoice.payment_status = PaymentStatus.PAID.value
        doc.status = "paid"
    elif total_paid > Decimal("0.00"):
        invoice.payment_status = PaymentStatus.PARTIAL.value
        doc.status = "partial"
    else:
        if invoice.due_date < date.today():
            invoice.payment_status = PaymentStatus.OVERDUE.value
            doc.status = "overdue"
        else:
            invoice.payment_status = PaymentStatus.UNPAID.value
            if doc.status in ["paid", "partial"]:
                doc.status = "sent"


# ----------------------------------------------------
# Invoice Specific Payments
# ----------------------------------------------------
@router.post("/invoices/{invoice_id}/payments", response_model=PaymentResponse)
def record_payment(
    invoice_id: int,
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional)
):
    """
    Record a full or partial payment against an invoice.
    Updates invoice amount_paid, recalculates status, and adds audit log.
    """
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    doc = db.query(Document).filter(Document.id == invoice_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Parent document record not found")

    if payload.amount <= Decimal("0.00"):
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero")

    payment = Payment(
        invoice_id=invoice.id,
        date=payload.date,
        amount=payload.amount,
        mode=payload.mode,
        reference=payload.reference.strip() if payload.reference else None,
        notes=payload.notes.strip() if payload.notes else None
    )
    db.add(payment)
    db.flush()

    # Recalculate status
    _recalculate_invoice_status(invoice, doc)

    # Audit log
    audit = AuditLog(
        user_id=user.id if user else None,
        action="invoice.payment_recorded",
        entity="invoice",
        entity_id=invoice.id,
        details={
            "payment_id": payment.id,
            "amount": float(payment.amount),
            "mode": payment.mode,
            "reference": payment.reference,
            "total_paid": float(invoice.amount_paid),
            "status": invoice.payment_status
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(payment)

    resp = PaymentResponse.model_validate(payment)
    resp.invoice_doc_number = doc.doc_number
    if doc.client:
        resp.client_legal_name = doc.client.legal_name
    return resp


@router.get("/invoices/{invoice_id}/payments", response_model=List[PaymentResponse])
def list_invoice_payments(invoice_id: int, db: Session = Depends(get_db)):
    """List all payment records for a specific invoice."""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    doc = invoice.document
    payments = db.query(Payment).filter(Payment.invoice_id == invoice_id).order_by(Payment.date.desc(), Payment.id.desc()).all()
    results = []
    for p in payments:
        resp = PaymentResponse.model_validate(p)
        resp.invoice_doc_number = doc.doc_number if doc else None
        if doc and doc.client:
            resp.client_legal_name = doc.client.legal_name
        results.append(resp)
    return results


@router.get("/invoices/{invoice_id}/summary", response_model=InvoicePaymentSummary)
def get_invoice_summary(invoice_id: int, db: Session = Depends(get_db)):
    """Get complete payment and balance summary for an invoice."""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    doc = invoice.document
    payments = db.query(Payment).filter(Payment.invoice_id == invoice_id).order_by(Payment.date.desc()).all()
    payment_responses = [PaymentResponse.model_validate(p) for p in payments]
    for pr in payment_responses:
        pr.invoice_doc_number = doc.doc_number if doc else None
        if doc and doc.client:
            pr.client_legal_name = doc.client.legal_name

    balance_due = max(Decimal("0.00"), Decimal(str(invoice.total)) - Decimal(str(invoice.amount_paid)))

    return InvoicePaymentSummary(
        id=invoice.id,
        doc_number=doc.doc_number if doc else f"INV-{invoice.id}",
        client_legal_name=doc.client.legal_name if doc and doc.client else None,
        total=Decimal(str(invoice.total)),
        amount_paid=Decimal(str(invoice.amount_paid)),
        balance_due=balance_due,
        payment_status=invoice.payment_status,
        due_date=invoice.due_date,
        issue_date=invoice.issue_date,
        payments=payment_responses
    )


@router.delete("/invoices/{invoice_id}/payments/{payment_id}")
def delete_payment(
    invoice_id: int,
    payment_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional)
):
    """Delete a payment entry and automatically restore invoice balance and status."""
    payment = db.query(Payment).filter(Payment.id == payment_id, Payment.invoice_id == invoice_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment entry not found for this invoice")

    invoice = payment.invoice
    doc = invoice.document
    deleted_amt = float(payment.amount)

    db.delete(payment)
    db.flush()

    # Recalculate status
    _recalculate_invoice_status(invoice, doc)

    audit = AuditLog(
        user_id=user.id if user else None,
        action="invoice.payment_deleted",
        entity="invoice",
        entity_id=invoice.id,
        details={
            "deleted_payment_id": payment_id,
            "deleted_amount": deleted_amt,
            "total_paid": float(invoice.amount_paid),
            "status": invoice.payment_status
        }
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Payment entry deleted successfully",
        "amount_paid": float(invoice.amount_paid),
        "payment_status": invoice.payment_status
    }


# ----------------------------------------------------
# Global Payments Ledger
# ----------------------------------------------------
@router.get("/payments", response_model=List[PaymentResponse])
def list_all_payments(
    client_id: Optional[int] = None,
    mode: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """
    Global ledger of all payments across all clients.
    Supports filtering by client, payment mode, and date range.
    """
    query = db.query(Payment).join(Invoice, Payment.invoice_id == Invoice.id).join(Document, Invoice.id == Document.id)

    if client_id:
        query = query.filter(Document.client_id == client_id)
    if mode:
        query = query.filter(Payment.mode == mode)
    if from_date:
        query = query.filter(Payment.date >= from_date)
    if to_date:
        query = query.filter(Payment.date <= to_date)

    payments = query.order_by(Payment.date.desc(), Payment.id.desc()).all()

    results = []
    for p in payments:
        resp = PaymentResponse.model_validate(p)
        if p.invoice and p.invoice.document:
            resp.invoice_doc_number = p.invoice.document.doc_number
            if p.invoice.document.client:
                resp.client_legal_name = p.invoice.document.client.legal_name
        results.append(resp)
    return results


# ----------------------------------------------------
# Financial Analytics & Accounts Receivable
# ----------------------------------------------------
@router.get("/finance/summary", response_model=FinanceSummaryResponse)
def get_finance_summary(db: Session = Depends(get_db)):
    """
    Overview of accounts receivable, total revenue, collected payments,
    overdue balances, and breakdown per client.
    """
    invoices = db.query(Invoice).join(Document, Invoice.id == Document.id).all()

    total_invoiced = Decimal("0.00")
    total_collected = Decimal("0.00")
    overdue_amount = Decimal("0.00")
    paid_count = 0
    partial_count = 0
    unpaid_count = 0
    overdue_count = 0

    today = date.today()

    client_stats = {}

    for inv in invoices:
        inv_tot = Decimal(str(inv.total or 0))
        inv_paid = Decimal(str(inv.amount_paid or 0))
        inv_balance = max(Decimal("0.00"), inv_tot - inv_paid)

        total_invoiced += inv_tot
        total_collected += inv_paid

        # Determine true status
        if inv_paid >= inv_tot and inv_tot > Decimal("0.00"):
            paid_count += 1
        elif inv_paid > Decimal("0.00"):
            partial_count += 1
            if inv.due_date < today:
                overdue_count += 1
                overdue_amount += inv_balance
        else:
            if inv.due_date < today:
                overdue_count += 1
                overdue_amount += inv_balance
            else:
                unpaid_count += 1

        # Client aggregation
        c_id = inv.document.client_id if inv.document else None
        c_name = inv.document.client.legal_name if inv.document and inv.document.client else "Unassigned"

        if c_id not in client_stats:
            client_stats[c_id] = {
                "client_id": c_id or 0,
                "client_name": c_name,
                "total_invoiced": Decimal("0.00"),
                "total_collected": Decimal("0.00"),
                "outstanding_balance": Decimal("0.00"),
                "invoices_count": 0
            }
        client_stats[c_id]["total_invoiced"] += inv_tot
        client_stats[c_id]["total_collected"] += inv_paid
        client_stats[c_id]["outstanding_balance"] += inv_balance
        client_stats[c_id]["invoices_count"] += 1

    outstanding = max(Decimal("0.00"), total_invoiced - total_collected)

    client_balances = [
        ClientFinancialBalance(**v)
        for v in client_stats.values()
    ]
    client_balances.sort(key=lambda x: x.outstanding_balance, reverse=True)

    return FinanceSummaryResponse(
        total_invoiced=total_invoiced,
        total_collected=total_collected,
        outstanding_receivables=outstanding,
        overdue_amount=overdue_amount,
        paid_count=paid_count,
        partial_count=partial_count,
        unpaid_count=unpaid_count,
        overdue_count=overdue_count,
        client_balances=client_balances
    )
