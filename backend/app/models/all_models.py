"""SQLAlchemy Models for DocForge"""
from datetime import datetime, date, timezone
from enum import Enum
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, Date, ForeignKey, Numeric, JSON
)
from sqlalchemy.orm import relationship
from app.core.db import Base


class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    VIEWER = "viewer"


class TemplateType(str, Enum):
    NDA = "nda"
    SOW = "sow"
    MSA = "msa"
    INVOICE = "invoice"
    OTHER = "other"


class DocumentStatus(str, Enum):
    DRAFT = "draft"
    GENERATED = "generated"
    SENT = "sent"
    SIGNED = "signed"
    ARCHIVED = "archived"


class PaymentStatus(str, Enum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.VIEWER.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    documents = relationship("Document", back_populates="creator")
    audit_logs = relationship("AuditLog", back_populates="user")


class CompanySettings(Base):
    __tablename__ = "company_settings"

    id = Column(Integer, primary_key=True)
    legal_name = Column(String(200), nullable=False, default="AKS Forge by Curawave LLP")
    trade_name = Column(String(200), nullable=True, default="AKS Forge")
    address = Column(Text, nullable=True, default="Suite 4B, Salt Lake Sector V")
    state = Column(String(100), nullable=True, default="West Bengal")
    state_code = Column(String(5), nullable=True, default="19")
    country = Column(String(100), nullable=True, default="India")
    gstin = Column(String(20), nullable=True, default="19AABCA1234F1Z5")
    pan = Column(String(15), nullable=True, default="AABCA1234F")
    email = Column(String(100), nullable=True, default="billing@aksforge.local")
    phone = Column(String(30), nullable=True, default="+91 98765 43210")
    website = Column(String(150), nullable=True, default="https://aksforge.local")
    logo_path = Column(String(255), nullable=True)
    signature_path = Column(String(255), nullable=True)
    
    # Banking
    bank_name = Column(String(100), nullable=True, default="HDFC Bank")
    bank_account_no = Column(String(50), nullable=True, default="50200012345678")
    bank_ifsc = Column(String(20), nullable=True, default="HDFC0000123")
    bank_branch = Column(String(100), nullable=True, default="Salt Lake Branch")
    bank_account_name = Column(String(150), nullable=True, default="AKS Forge by Curawave LLP")
    upi_id = Column(String(100), nullable=True, default="aksforge@hdfcbank")

    # Defaults
    default_currency = Column(String(10), default="INR")
    default_payment_terms_days = Column(Integer, default=15)
    default_tax_rate = Column(Numeric(5, 2), default=18.00)
    invoice_footer = Column(Text, nullable=True, default="Thank you for your business. Please quote the invoice number when making payment.")
    theme_accent = Column(String(30), default="#4f46e5")
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    legal_name = Column(String(200), nullable=False, index=True)
    display_name = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    state = Column(String(100), nullable=True)
    state_code = Column(String(5), nullable=True)
    country = Column(String(100), default="India")
    gstin = Column(String(20), nullable=True)
    pan = Column(String(15), nullable=True)
    billing_email = Column(String(100), nullable=True)
    signatory_name = Column(String(100), nullable=True)
    signatory_designation = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    contacts = relationship("Contact", back_populates="client", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="client")
    documents = relationship("Document", back_populates="client")


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True)
    phone = Column(String(30), nullable=True)
    role = Column(String(50), nullable=True)

    client = relationship("Client", back_populates="contacts")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False)
    name = Column(String(200), nullable=False)
    service_type = Column(String(50), default="tech")  # tech, marketing, other
    description = Column(Text, nullable=True)
    status = Column(String(30), default="active")  # active, completed, on_hold, cancelled
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    client = relationship("Client", back_populates="projects")
    documents = relationship("Document", back_populates="project")


class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(20), nullable=False, default=TemplateType.OTHER.value)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    versions = relationship("TemplateVersion", back_populates="template", cascade="all, delete-orphan", order_by="desc(TemplateVersion.version_no)")


class TemplateVersion(Base):
    __tablename__ = "template_versions"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    version_no = Column(Integer, nullable=False, default=1)
    file_path = Column(String(255), nullable=False)
    field_schema = Column(JSON, nullable=False, default=dict)  # Field definitions, validation, groups
    locked_at = Column(DateTime, nullable=True)  # Set once any document references this version
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    template = relationship("Template", back_populates="versions")
    documents = relationship("Document", back_populates="template_version")


class ClauseBlock(Base):
    __tablename__ = "clause_blocks"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), nullable=False)  # payment_terms, ip_ownership, revision_limits, confidentiality, warranty, termination
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)  # Jinja template snippet
    applies_to = Column(String(100), default="sow")  # comma-separated template types (e.g., sow, msa)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(30), nullable=False)  # nda, sow, msa, invoice, other
    doc_number = Column(String(100), nullable=False, unique=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    parent_document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    template_version_id = Column(Integer, ForeignKey("template_versions.id", ondelete="RESTRICT"), nullable=True)
    status = Column(String(30), default=DocumentStatus.DRAFT.value)
    input_data = Column(JSON, nullable=False, default=dict)  # Full JSON snapshot of form inputs
    docx_path = Column(String(255), nullable=True)
    pdf_path = Column(String(255), nullable=True)
    file_hash = Column(String(64), nullable=True)  # SHA256 of generated file
    revision_no = Column(Integer, default=1)
    is_legacy = Column(Boolean, default=False, nullable=False) # True if imported from previous order/book
    legacy_source = Column(String(100), nullable=True) # e.g. "Physical Book", "Old CRM", "Signed Copy"
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    client = relationship("Client", back_populates="documents")
    project = relationship("Project", back_populates="documents")
    creator = relationship("User", back_populates="documents")
    template_version = relationship("TemplateVersion", back_populates="documents")
    parent_document = relationship("Document", remote_side=[id], backref="child_documents")
    invoice = relationship("Invoice", uselist=False, back_populates="document", cascade="all, delete-orphan")
    sow_milestones = relationship("SowMilestone", back_populates="document", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="document", cascade="all, delete-orphan")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    issue_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    currency = Column(String(10), default="INR")
    place_of_supply = Column(String(100), nullable=True)  # State name or state code
    is_interstate = Column(Boolean, default=False)
    is_export = Column(Boolean, default=False)
    
    # Financials (Decimal)
    subtotal = Column(Numeric(12, 2), default=0.00)
    discount_total = Column(Numeric(12, 2), default=0.00)
    cgst = Column(Numeric(12, 2), default=0.00)
    sgst = Column(Numeric(12, 2), default=0.00)
    igst = Column(Numeric(12, 2), default=0.00)
    tds = Column(Numeric(12, 2), default=0.00)
    total = Column(Numeric(12, 2), default=0.00)
    amount_paid = Column(Numeric(12, 2), default=0.00)
    payment_status = Column(String(30), default=PaymentStatus.UNPAID.value)
    amount_in_words = Column(String(255), nullable=True)

    document = relationship("Document", back_populates="invoice")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    description = Column(String(255), nullable=False)
    sac_code = Column(String(20), nullable=True, default="998314")  # IT design & development
    quantity = Column(Numeric(10, 2), default=1.00)
    unit = Column(String(20), default="nos")
    rate = Column(Numeric(12, 2), default=0.00)
    discount = Column(Numeric(12, 2), default=0.00)
    tax_rate = Column(Numeric(5, 2), default=18.00)
    amount = Column(Numeric(12, 2), default=0.00)

    invoice = relationship("Invoice", back_populates="items")


class SowMilestone(Base):
    __tablename__ = "sow_milestones"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    deliverable = Column(Text, nullable=True)
    due_date = Column(Date, nullable=True)
    amount = Column(Numeric(12, 2), default=0.00)
    linked_invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True)

    document = relationship("Document", back_populates="sow_milestones")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    amount = Column(Numeric(12, 2), nullable=False)
    mode = Column(String(50), default="bank_transfer")  # bank_transfer, upi, cheque, cash
    reference = Column(String(100), nullable=True)  # UTR, transaction ID, cheque number
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    invoice = relationship("Invoice", back_populates="payments")


class NumberSequence(Base):
    __tablename__ = "number_sequences"

    id = Column(Integer, primary_key=True, index=True)
    doc_type = Column(String(30), nullable=False)  # invoice, sow, nda, msa, general
    financial_year = Column(String(10), nullable=False)  # e.g., 2026-27
    last_number = Column(Integer, default=0, nullable=False)
    prefix_format = Column(String(100), default="{TYPE}/{FY}/{SEQ:04d}")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_name = Column(String(200), nullable=False)
    kind = Column(String(50), default="signed_copy")  # signed_copy, annexure, brief, other
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="attachments")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)  # document.generate, invoice.payment, etc.
    entity = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="audit_logs")
