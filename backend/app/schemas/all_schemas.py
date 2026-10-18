"""Pydantic V2 Schemas for DocForge"""
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ----------------------------------------------------
# Auth & User Schemas
# ----------------------------------------------------
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)
    role: str = "viewer"
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserFirstRun(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# Company Settings Schemas
# ----------------------------------------------------
class CompanySettingsBase(BaseModel):
    legal_name: str = "AKS Forge by Curawave LLP"
    trade_name: Optional[str] = "AKS Forge"
    address: Optional[str] = "Suite 4B, Salt Lake Sector V"
    state: Optional[str] = "West Bengal"
    state_code: Optional[str] = "19"
    country: Optional[str] = "India"
    gstin: Optional[str] = "19AABCA1234F1Z5"
    pan: Optional[str] = "AABCA1234F"
    email: Optional[str] = "billing@aksforge.local"
    phone: Optional[str] = "+91 98765 43210"
    website: Optional[str] = "https://aksforge.local"
    logo_path: Optional[str] = None
    signature_path: Optional[str] = None

    bank_name: Optional[str] = "HDFC Bank"
    bank_account_no: Optional[str] = "50200012345678"
    bank_ifsc: Optional[str] = "HDFC0000123"
    bank_branch: Optional[str] = "Salt Lake Branch"
    bank_account_name: Optional[str] = "AKS Forge by Curawave LLP"
    upi_id: Optional[str] = "aksforge@hdfcbank"

    default_currency: str = "INR"
    default_payment_terms_days: int = 15
    default_tax_rate: Decimal = Decimal("18.00")
    invoice_footer: Optional[str] = "Thank you for your business."
    theme_accent: str = "#4f46e5"

class CompanySettingsUpdate(CompanySettingsBase):
    pass

class CompanySettingsResponse(CompanySettingsBase):
    id: int
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# Health Check Schemas
# ----------------------------------------------------
class HealthCheckResponse(BaseModel):
    status: str
    version: str
    database: bool
    libreoffice_available: bool
    libreoffice_path: Optional[str] = None
    weasyprint_available: bool
    data_dir_writable: bool
    is_first_run: bool


# ----------------------------------------------------
# Client & Project Schemas
# ----------------------------------------------------
class ContactBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None

class ContactCreate(ContactBase):
    pass

class ContactResponse(ContactBase):
    id: int
    client_id: int
    model_config = ConfigDict(from_attributes=True)

class ClientBase(BaseModel):
    legal_name: str
    display_name: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = "West Bengal"
    state_code: Optional[str] = "19"
    country: Optional[str] = "India"
    gstin: Optional[str] = None
    pan: Optional[str] = None
    billing_email: Optional[str] = None
    signatory_name: Optional[str] = None
    signatory_designation: Optional[str] = None
    notes: Optional[str] = None

class ClientCreate(ClientBase):
    contacts: Optional[List[ContactCreate]] = []

class ClientUpdate(ClientBase):
    pass

class ClientResponse(ClientBase):
    id: int
    created_at: datetime
    contacts: List[ContactResponse] = []
    model_config = ConfigDict(from_attributes=True)

class ProjectBase(BaseModel):
    name: str
    client_id: int
    service_type: str = "tech"
    description: Optional[str] = None
    status: str = "active"
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    client_legal_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# Template & Version Schemas
# ----------------------------------------------------
class TemplateVersionResponse(BaseModel):
    id: int
    template_id: int
    version_no: int
    file_path: str
    field_schema: List[Dict[str, Any]]
    locked_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TemplateBase(BaseModel):
    type: str  # nda, sow, msa, invoice, other
    name: str
    description: Optional[str] = None
    is_active: bool = True

class TemplateCreate(TemplateBase):
    pass

class TemplateResponse(TemplateBase):
    id: int
    created_at: datetime
    versions: List[TemplateVersionResponse] = []
    model_config = ConfigDict(from_attributes=True)

class TemplateSchemaUpdate(BaseModel):
    field_schema: List[Dict[str, Any]]


# ----------------------------------------------------
# Clause Schemas
# ----------------------------------------------------
class ClauseBase(BaseModel):
    category: str
    title: str
    body: str
    applies_to: str = "sow"
    is_default: bool = False

class ClauseCreate(ClauseBase):
    pass

class ClauseResponse(ClauseBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# Document Generation & Existing / Legacy Order Schemas
# ----------------------------------------------------
class MilestoneItem(BaseModel):
    title: str
    deliverable: Optional[str] = None
    due_date: Optional[str] = None
    amount: Decimal = Decimal("0.00")

class DocumentGenerateRequest(BaseModel):
    template_version_id: int
    client_id: Optional[int] = None
    project_id: Optional[int] = None
    parent_document_id: Optional[int] = None
    input_data: Dict[str, Any]
    milestones: Optional[List[MilestoneItem]] = []
    selected_clause_ids: Optional[List[int]] = []

class LegacyOrderImportRequest(BaseModel):
    """Import historical/existing orders signed before DocForge"""
    type: str = "sow"  # sow, nda, msa, invoice
    custom_doc_number: str
    client_id: Optional[int] = None
    project_name: Optional[str] = None
    effective_date: date
    status: str = "signed" # signed, archived, sent
    total_amount: Decimal = Decimal("0.00")
    currency: str = "INR"
    legacy_source: Optional[str] = "Previous Records Book"
    notes: Optional[str] = None
    milestones: Optional[List[MilestoneItem]] = []

class DocumentResponse(BaseModel):
    id: int
    type: str
    doc_number: str
    client_id: Optional[int] = None
    project_id: Optional[int] = None
    parent_document_id: Optional[int] = None
    template_version_id: Optional[int] = None
    status: str
    input_data: Dict[str, Any]
    docx_path: Optional[str] = None
    pdf_path: Optional[str] = None
    file_hash: Optional[str] = None
    revision_no: int
    is_legacy: bool
    legacy_source: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    client_legal_name: Optional[str] = None
    project_name: Optional[str] = None
    amount_paid: Optional[Decimal] = None
    total_amount: Optional[Decimal] = None
    payment_status: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class InvoiceItemInput(BaseModel):
    description: str
    sac_code: Optional[str] = "998314"
    quantity: Decimal = Decimal("1.00")
    unit: str = "nos"
    rate: Decimal = Decimal("0.00")
    discount: Decimal = Decimal("0.00")
    tax_rate: Decimal = Decimal("18.00")
    amount: Decimal = Decimal("0.00")


class InvoiceCreateRequest(BaseModel):
    client_id: Optional[int] = None
    project_id: Optional[int] = None
    issue_date: date
    due_date: date
    currency: str = "INR"
    place_of_supply: Optional[str] = None
    is_interstate: bool = False
    is_export: bool = False
    custom_doc_number: Optional[str] = None
    po_reference: Optional[str] = None
    notes: Optional[str] = None
    items: List[InvoiceItemInput] = []
    subtotal: Decimal = Decimal("0.00")
    discount_total: Decimal = Decimal("0.00")
    cgst: Decimal = Decimal("0.00")
    sgst: Decimal = Decimal("0.00")
    igst: Decimal = Decimal("0.00")
    tds: Decimal = Decimal("0.00")
    total: Decimal = Decimal("0.00")
    amount_in_words: Optional[str] = None
    status: str = "sent"


# ----------------------------------------------------
# Payment & Finance Schemas
# ----------------------------------------------------
class PaymentCreate(BaseModel):
    date: date
    amount: Decimal
    mode: str = "bank_transfer"  # bank_transfer, upi, cheque, cash
    reference: Optional[str] = None  # UTR, transaction ID, cheque number
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    invoice_id: int
    date: date
    amount: Decimal
    mode: str
    reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    invoice_doc_number: Optional[str] = None
    client_legal_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class InvoicePaymentSummary(BaseModel):
    id: int
    doc_number: str
    client_legal_name: Optional[str] = None
    total: Decimal
    amount_paid: Decimal
    balance_due: Decimal
    payment_status: str
    due_date: date
    issue_date: date
    payments: List[PaymentResponse] = []
    model_config = ConfigDict(from_attributes=True)


class ClientFinancialBalance(BaseModel):
    client_id: int
    client_name: str
    total_invoiced: Decimal
    total_collected: Decimal
    outstanding_balance: Decimal
    invoices_count: int


class FinanceSummaryResponse(BaseModel):
    total_invoiced: Decimal
    total_collected: Decimal
    outstanding_receivables: Decimal
    overdue_amount: Decimal
    paid_count: int
    partial_count: int
    unpaid_count: int
    overdue_count: int
    client_balances: List[ClientFinancialBalance] = []

