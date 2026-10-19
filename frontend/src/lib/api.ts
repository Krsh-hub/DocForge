import axios from "axios";

export const getDefaultApiUrl = () => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("docforge_server_url");
    if (saved) return saved.replace(/\/+$/, "");
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
};

export const API_BASE_URL = getDefaultApiUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("docforge_server_url");
    if (saved) {
      config.baseURL = saved.replace(/\/+$/, "");
    }
    const token = localStorage.getItem("docforge_auth_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});


export interface User {
  id: number;
  name: string;
  username: string;
  role: "admin" | "manager" | "viewer";
  is_active: boolean;
  created_at?: string;
}

export interface AuthStatus {
  is_first_run: boolean;
  is_authenticated: boolean;
  user: User | null;
}

export interface HealthStatus {
  status: string;
  version: string;
  database: boolean;
  libreoffice_available: boolean;
  libreoffice_path: string | null;
  weasyprint_available: boolean;
  data_dir_writable: boolean;
  is_first_run: boolean;
}

export interface CompanySettings {
  id?: number;
  legal_name: string;
  trade_name?: string;
  address?: string;
  state?: string;
  state_code?: string;
  country?: string;
  gstin?: string;
  pan?: string;
  email?: string;
  phone?: string;
  website?: string;
  logo_path?: string;
  signature_path?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_ifsc?: string;
  bank_branch?: string;
  bank_account_name?: string;
  upi_id?: string;
  default_currency: string;
  default_payment_terms_days: number;
  default_tax_rate: number;
  invoice_footer?: string;
  theme_accent: string;
  updated_at?: string;
}

export interface TemplateVersion {
  id: number;
  template_id: number;
  version_no: number;
  file_path: string;
  field_schema: Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
    default: any;
    group: string;
    help_text?: string;
  }>;
  locked_at: string | null;
  created_at: string;
}

export interface Template {
  id: number;
  type: "nda" | "sow" | "msa" | "invoice" | "other";
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  versions: TemplateVersion[];
}

export interface Client {
  id: number;
  legal_name: string;
  display_name?: string;
  address?: string;
  state?: string;
  state_code?: string;
  country?: string;
  gstin?: string;
  pan?: string;
  billing_email?: string;
  signatory_name?: string;
  signatory_designation?: string;
  notes?: string;
  created_at?: string;
}

export interface Project {
  id: number;
  client_id: number;
  name: string;
  service_type: string;
  description?: string;
  status: string;
  client_legal_name?: string;
  created_at?: string;
}

export interface ClauseBlock {
  id: number;
  category: string;
  title: string;
  body: string;
  applies_to: string;
  is_default: boolean;
}

export interface MilestoneItem {
  title: string;
  deliverable?: string;
  due_date?: string;
  amount: number;
}

export interface DocumentItem {
  id: number;
  type: string;
  doc_number: string;
  client_id?: number;
  project_id?: number;
  status: string;
  input_data: Record<string, any>;
  docx_path?: string;
  pdf_path?: string;
  file_hash?: string;
  revision_no: number;
  is_legacy: boolean;
  legacy_source?: string;
  notes?: string;
  created_at: string;
  client_legal_name?: string;
  project_name?: string;
  amount_paid?: number;
  total_amount?: number;
  payment_status?: string;
}

export interface PaymentItem {
  id: number;
  invoice_id: number;
  date: string;
  amount: number;
  mode: string;
  reference?: string;
  notes?: string;
  created_at: string;
  invoice_doc_number?: string;
  client_legal_name?: string;
}

export interface InvoicePaymentSummary {
  id: number;
  doc_number: string;
  client_legal_name?: string;
  total: number;
  amount_paid: number;
  balance_due: number;
  payment_status: string;
  due_date: string;
  issue_date: string;
  payments: PaymentItem[];
}

export interface ClientFinancialBalance {
  client_id: number;
  client_name: string;
  total_invoiced: number;
  total_collected: number;
  outstanding_balance: number;
  invoices_count: number;
}

export interface FinanceSummary {
  total_invoiced: number;
  total_collected: number;
  outstanding_receivables: number;
  overdue_amount: number;
  paid_count: number;
  partial_count: number;
  unpaid_count: number;
  overdue_count: number;
  client_balances: ClientFinancialBalance[];
}


