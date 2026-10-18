"""Document Generation, Legacy Orders Import, Preview, Regeneration, and Cloning Router"""
import os
import shutil
from pathlib import Path
from datetime import datetime, date, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.config import settings
from app.models.all_models import (
    Document, DocumentStatus, TemplateVersion, Template, Client, Project,
    ClauseBlock, SowMilestone, Attachment, CompanySettings, AuditLog,
    Invoice, InvoiceItem, Payment, PaymentStatus
)
from app.schemas.all_schemas import (
    DocumentGenerateRequest, LegacyOrderImportRequest, DocumentResponse,
    InvoiceCreateRequest
)
from app.services.numbering_service import allocate_document_number
from app.services.render_service import render_docx, convert_docx_to_pdf, calculate_file_hash
from app.routers.deps import get_current_user_optional, require_manager_or_admin

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.get("", response_model=List[DocumentResponse])
def list_documents(
    doc_type: Optional[str] = None,
    client_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    legacy_only: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    if doc_type:
        query = query.filter(Document.type == doc_type.lower())
    if client_id:
        query = query.filter(Document.client_id == client_id)
    if status_filter:
        query = query.filter(Document.status == status_filter)
    if legacy_only is not None:
        query = query.filter(Document.is_legacy == legacy_only)

    docs = query.order_by(Document.created_at.desc()).all()
    results = []
    for d in docs:
        resp = DocumentResponse.model_validate(d)
        if d.client:
            resp.client_legal_name = d.client.legal_name
        if d.project:
            resp.project_name = d.project.name
        if d.invoice:
            resp.amount_paid = d.invoice.amount_paid
            resp.total_amount = d.invoice.total
            resp.payment_status = d.invoice.payment_status
        results.append(resp)
    return results


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    d = db.query(Document).filter(Document.id == document_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Document not found")
    resp = DocumentResponse.model_validate(d)
    if d.client:
        resp.client_legal_name = d.client.legal_name
    if d.project:
        resp.project_name = d.project.name
    if d.invoice:
        resp.amount_paid = d.invoice.amount_paid
        resp.total_amount = d.invoice.total
        resp.payment_status = d.invoice.payment_status
    return resp


@router.post("/import-legacy-order", response_model=DocumentResponse)
def import_legacy_order(
    payload: LegacyOrderImportRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional)
):
    """
    Record and import existing/legacy orders executed before DocForge.
    Allows capturing historic contract number, dates, scope, and milestones.
    """
    # Check if document number already exists
    existing = db.query(Document).filter(Document.doc_number == payload.custom_doc_number.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Document number '{payload.custom_doc_number}' already exists in system.")

    # Auto-link or create project if specified
    project_id = None
    if payload.client_id and payload.project_name:
        proj = db.query(Project).filter(
            Project.client_id == payload.client_id,
            Project.name == payload.project_name.strip()
        ).first()
        if not proj:
            proj = Project(
                client_id=payload.client_id,
                name=payload.project_name.strip(),
                status="active"
            )
            db.add(proj)
            db.flush()
        project_id = proj.id

    # Create document record marked as legacy
    input_snapshot = {
        "custom_doc_number": payload.custom_doc_number,
        "effective_date": payload.effective_date.isoformat(),
        "total_amount": float(payload.total_amount),
        "currency": payload.currency,
        "legacy_source": payload.legacy_source,
        "notes": payload.notes,
        "milestones": [
            {
                "title": m.title,
                "deliverable": m.deliverable,
                "due_date": m.due_date,
                "amount": float(m.amount)
            }
            for m in payload.milestones
        ] if payload.milestones else []
    }

    doc = Document(
        type=payload.type.lower(),
        doc_number=payload.custom_doc_number.strip(),
        client_id=payload.client_id,
        project_id=project_id,
        status=payload.status,
        input_data=input_snapshot,
        is_legacy=True,
        legacy_source=payload.legacy_source,
        notes=payload.notes,
        created_by=user.id if user else None,
        created_at=datetime.combine(payload.effective_date, datetime.min.time(), tzinfo=timezone.utc)
    )
    db.add(doc)
    db.flush()

    # Save milestones
    if payload.milestones:
        for m in payload.milestones:
            m_due = None
            if m.due_date:
                try:
                    m_due = date.fromisoformat(m.due_date)
                except Exception:
                    pass
            milestone = SowMilestone(
                document_id=doc.id,
                title=m.title,
                deliverable=m.deliverable,
                due_date=m_due,
                amount=m.amount
            )
            db.add(milestone)

    # Audit log
    audit = AuditLog(
        user_id=user.id if user else None,
        action="document.import_legacy",
        entity="document",
        entity_id=doc.id,
        details={"doc_number": doc.doc_number, "source": payload.legacy_source}
    )
    db.add(audit)

    db.commit()
    db.refresh(doc)

    resp = DocumentResponse.model_validate(doc)
    if doc.client:
        resp.client_legal_name = doc.client.legal_name
    if doc.project:
        resp.project_name = doc.project.name
    return resp


@router.post("/generate", response_model=DocumentResponse)
def generate_document(
    payload: DocumentGenerateRequest,
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    """
    Generate a new document from a template version.
    1. Lock template version (ensures immutability).
    2. Atomically allocate document number.
    3. Prepare Jinja context (Company + Client + Project + Clauses + Inputs).
    4. Render DOCX using sandboxed docxtpl.
    5. Convert to PDF via headless LibreOffice (if installed).
    6. Record file hash and audit log.
    """
    # 1. Fetch template version
    version = db.query(TemplateVersion).filter(TemplateVersion.id == payload.template_version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Template version not found")

    template = version.template
    tpl_type = template.type

    # Lock version if not already locked
    if version.locked_at is None:
        version.locked_at = datetime.now(timezone.utc)
        db.add(version)

    # 2. Allocate document number
    doc_number = allocate_document_number(db, tpl_type)

    # 3. Assemble render context
    company = db.query(CompanySettings).first()
    client = db.query(Client).filter(Client.id == payload.client_id).first() if payload.client_id else None
    project = db.query(Project).filter(Project.id == payload.project_id).first() if payload.project_id else None

    # Selected clauses
    clauses = []
    if payload.selected_clause_ids:
        clauses = db.query(ClauseBlock).filter(ClauseBlock.id.in_(payload.selected_clause_ids)).all()

    context = dict(payload.input_data)
    context["doc_number"] = doc_number
    context["company"] = {
        "legal_name": company.legal_name if company else "AKS Forge by Curawave LLP",
        "trade_name": company.trade_name if company else "AKS Forge",
        "address": company.address if company else "",
        "state": company.state if company else "West Bengal",
        "gstin": company.gstin if company else "",
        "pan": company.pan if company else "",
        "email": company.email if company else "",
        "phone": company.phone if company else "",
    }
    context["client"] = {
        "legal_name": client.legal_name if client else payload.input_data.get("client_name", ""),
        "address": client.address if client else payload.input_data.get("client_address", ""),
        "state": client.state if client else "West Bengal",
        "country": client.country if client else "India",
        "gstin": client.gstin if client else "",
        "pan": client.pan if client else "",
        "signatory_name": client.signatory_name if client else payload.input_data.get("signatory_name", "Authorized Signatory"),
        "signatory_designation": client.signatory_designation if client else payload.input_data.get("signatory_designation", "Director"),
    }
    if project:
        context["project"] = {
            "name": project.name,
            "service_type": project.service_type,
            "description": project.description,
        }

    context["selected_clauses"] = [
        {"title": c.title, "body": c.body, "category": c.category}
        for c in clauses
    ]

    milestone_dicts = [m.model_dump() for m in payload.milestones] if payload.milestones else []
    context["milestones"] = milestone_dicts

    # Ensure effective_date exists in context
    if "effective_date" not in context:
        context["effective_date"] = date.today().strftime("%d %B %Y")

    # 4. Render DOCX
    template_full_path = settings.resolved_data_dir / version.file_path.lstrip("/\\")
    clean_num = doc_number.replace("/", "_").replace("\\", "_")
    output_docx_filename = f"{clean_num}.docx"
    output_docx_path = settings.generated_dir / output_docx_filename

    render_docx(template_full_path, context, output_docx_path)
    file_hash = calculate_file_hash(output_docx_path)

    # 5. Convert to PDF
    pdf_full_path = convert_docx_to_pdf(output_docx_path)
    pdf_rel_path = f"/generated/{pdf_full_path.name}" if pdf_full_path else None

    # 6. Create Document record
    doc = Document(
        type=tpl_type,
        doc_number=doc_number,
        client_id=payload.client_id,
        project_id=payload.project_id,
        parent_document_id=payload.parent_document_id,
        template_version_id=version.id,
        status=DocumentStatus.GENERATED.value,
        input_data=payload.input_data,
        docx_path=f"/generated/{output_docx_filename}",
        pdf_path=pdf_rel_path,
        file_hash=file_hash,
        revision_no=1,
        is_legacy=False,
        created_by=user.id if user else None,
    )
    db.add(doc)
    db.flush()

    # Save milestones
    if payload.milestones:
        for m in payload.milestones:
            m_due = None
            if m.due_date:
                try:
                    m_due = date.fromisoformat(m.due_date)
                except Exception:
                    pass
            db.add(SowMilestone(
                document_id=doc.id,
                title=m.title,
                deliverable=m.deliverable,
                due_date=m_due,
                amount=m.amount
            ))

    # Audit log
    audit = AuditLog(
        user_id=user.id if user else None,
        action="document.generate",
        entity="document",
        entity_id=doc.id,
        details={"doc_number": doc.doc_number, "template_version": version.id}
    )
    db.add(audit)

    db.commit()
    db.refresh(doc)

    resp = DocumentResponse.model_validate(doc)
    if doc.client:
        resp.client_legal_name = doc.client.legal_name
    if doc.project:
        resp.project_name = doc.project.name
    return resp


@router.post("/{document_id}/upload-signed-copy")
def upload_signed_copy(
    document_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    """Attach signed copy of contract and update status to 'signed'"""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    ext = Path(file.filename or "").suffix.lower()
    filename = f"signed_{doc.id}_{file.filename}"
    dest_path = settings.uploads_dir / filename
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    attachment = Attachment(
        document_id=doc.id,
        file_path=f"/uploads/{filename}",
        file_name=file.filename or filename,
        kind="signed_copy"
    )
    db.add(attachment)
    doc.status = DocumentStatus.SIGNED.value

    # If it's a PDF, update document's pdf_path for direct preview
    if ext == ".pdf":
        doc.pdf_path = f"/uploads/{filename}"

    db.commit()
    return {"message": "Signed copy uploaded", "file_path": f"/uploads/{filename}"}


@router.get("/{document_id}/files/docx")
def download_docx(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or not doc.docx_path:
        raise HTTPException(status_code=404, detail="DOCX file not found")
    full_path = settings.resolved_data_dir / doc.docx_path.lstrip("/\\")
    if not full_path.is_file():
        raise HTTPException(status_code=404, detail="File missing on disk")
    return FileResponse(str(full_path), filename=f"{doc.doc_number}.docx")


@router.get("/{document_id}/files/pdf")
def download_pdf(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or not doc.pdf_path:
        raise HTTPException(status_code=404, detail="PDF file not available (LibreOffice conversion was not performed or failed)")
    full_path = settings.resolved_data_dir / doc.pdf_path.lstrip("/\\")
    if not full_path.is_file():
        raise HTTPException(status_code=404, detail="PDF missing on disk")
    return FileResponse(str(full_path), filename=f"{doc.doc_number}.pdf", media_type="application/pdf")


@router.post("/invoice", response_model=DocumentResponse)
def create_invoice(
    payload: InvoiceCreateRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional)
):
    """
    Create a new GST Tax Invoice with atomic sequence allocation,
    subtotal, CGST/SGST/IGST breakdown, and linked invoice items.
    """
    # 1. Allocate invoice number if not provided
    doc_number = payload.custom_doc_number.strip() if payload.custom_doc_number else allocate_document_number(db, "invoice")

    existing = db.query(Document).filter(Document.doc_number == doc_number).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Invoice number '{doc_number}' already exists.")

    client = db.query(Client).filter(Client.id == payload.client_id).first() if payload.client_id else None

    # Prepare input data snapshot
    items_snapshot = [
        {
            "description": it.description,
            "sac_code": it.sac_code,
            "quantity": float(it.quantity),
            "unit": it.unit,
            "rate": float(it.rate),
            "discount": float(it.discount),
            "tax_rate": float(it.tax_rate),
            "amount": float(it.amount),
        }
        for it in payload.items
    ]

    input_snapshot = {
        "invoice_number": doc_number,
        "issue_date": payload.issue_date.isoformat(),
        "due_date": payload.due_date.isoformat(),
        "currency": payload.currency,
        "place_of_supply": payload.place_of_supply,
        "is_interstate": payload.is_interstate,
        "is_export": payload.is_export,
        "po_reference": payload.po_reference,
        "subtotal": float(payload.subtotal),
        "discount_total": float(payload.discount_total),
        "cgst": float(payload.cgst),
        "sgst": float(payload.sgst),
        "igst": float(payload.igst),
        "tds": float(payload.tds),
        "total_amount": float(payload.total),
        "amount_in_words": payload.amount_in_words,
        "items": items_snapshot,
        "client_name": client.legal_name if client else "",
        "client_gstin": client.gstin if client else "",
        "client_address": client.address if client else "",
        "notes": payload.notes,
    }

    # Create Document record
    doc = Document(
        type="invoice",
        doc_number=doc_number,
        client_id=payload.client_id,
        project_id=payload.project_id,
        status=payload.status,
        input_data=input_snapshot,
        notes=payload.notes,
        is_legacy=False,
        created_by=user.id if user else None,
        created_at=datetime.combine(payload.issue_date, datetime.min.time(), tzinfo=timezone.utc)
    )
    db.add(doc)
    db.flush()

    # Create Invoice financial record
    inv_payment_status = "paid" if payload.status == "paid" else PaymentStatus.UNPAID.value
    invoice_record = Invoice(
        id=doc.id,
        issue_date=payload.issue_date,
        due_date=payload.due_date,
        currency=payload.currency,
        place_of_supply=payload.place_of_supply,
        is_interstate=payload.is_interstate,
        is_export=payload.is_export,
        subtotal=payload.subtotal,
        discount_total=payload.discount_total,
        cgst=payload.cgst,
        sgst=payload.sgst,
        igst=payload.igst,
        tds=payload.tds,
        total=payload.total,
        amount_paid=payload.total if payload.status == "paid" else 0.00,
        payment_status=inv_payment_status,
        amount_in_words=payload.amount_in_words
    )
    db.add(invoice_record)

    # Create Invoice Items
    for it in payload.items:
        db.add(InvoiceItem(
            invoice_id=doc.id,
            description=it.description,
            sac_code=it.sac_code,
            quantity=it.quantity,
            unit=it.unit,
            rate=it.rate,
            discount=it.discount,
            tax_rate=it.tax_rate,
            amount=it.amount
        ))

    # Audit log
    audit = AuditLog(
        user_id=user.id if user else None,
        action="invoice.create",
        entity="document",
        entity_id=doc.id,
        details={"doc_number": doc.doc_number, "total": float(payload.total)}
    )
    db.add(audit)

    db.commit()
    db.refresh(doc)

    resp = DocumentResponse.model_validate(doc)
    if doc.client:
        resp.client_legal_name = doc.client.legal_name
    if doc.project:
        resp.project_name = doc.project.name
    return resp


@router.patch("/{document_id}/status")
def update_document_status(
    document_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_optional)
):
    """Update document lifecycle status (draft, sent, paid, overdue, signed, void)"""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    new_status = payload.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Missing 'status' in request body")

    old_status = doc.status
    doc.status = new_status

    if doc.invoice:
        if new_status == "paid":
            doc.invoice.payment_status = "paid"
            doc.invoice.amount_paid = doc.invoice.total
        elif new_status == "sent":
            doc.invoice.payment_status = "unpaid"

    audit = AuditLog(
        user_id=user.id if user else None,
        action="document.status_update",
        entity="document",
        entity_id=doc.id,
        details={"old_status": old_status, "new_status": new_status}
    )
    db.add(audit)
    db.commit()

    return {"message": "Status updated successfully", "id": doc.id, "status": doc.status}


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_manager_or_admin)
):
    """Delete a document and cascade remove related invoice / milestones / attachments"""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc_num = doc.doc_number
    db.delete(doc)

    audit = AuditLog(
        user_id=user.id if user else None,
        action="document.delete",
        entity="document",
        entity_id=document_id,
        details={"doc_number": doc_num}
    )
    db.add(audit)
    db.commit()

    return {"message": f"Document {doc_num} deleted successfully"}
