import { Client, Project, CompanySettings, DocumentItem, FinanceSummary, ClauseBlock, Template } from "./api";

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  id: 1,
  legal_name: "DocForge Technologies Private Limited",
  trade_name: "DocForge Labs",
  address: "Sector V, Salt Lake Electronics Complex, Bidhannagar",
  state: "West Bengal",
  state_code: "19",
  country: "India",
  gstin: "19AAACD9876E1Z4",
  pan: "AAACD9876E",
  email: "billing@docforge.internal",
  phone: "+91 98765 43210",
  website: "https://docforge.internal",
  bank_name: "HDFC Bank",
  bank_account_no: "50200012345678",
  bank_ifsc: "HDFC0001234",
  bank_branch: "Salt Lake Sector V Branch",
  bank_account_name: "DocForge Technologies Private Limited",
  upi_id: "docforge@hdfcbank",
  default_currency: "INR",
  default_payment_terms_days: 15,
  default_tax_rate: 18,
  invoice_footer: "Payment is due within 15 days of invoice date. Please transfer funds to the specified bank account and quote invoice reference.",
  theme_accent: "#4f46e5",
};

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 1,
    legal_name: "Acme Cloud Solutions Pvt Ltd",
    display_name: "Acme Cloud",
    address: "4th Floor, Tech Park, Whitefield, Bengaluru",
    state: "Karnataka",
    state_code: "29",
    country: "India",
    gstin: "29AABCA1234A1Z5",
    pan: "AABCA1234A",
    billing_email: "accounts@acmecloud.io",
    signatory_name: "Rohan Sharma",
    signatory_designation: "Chief Technology Officer",
    notes: "Preferred client for annual cloud infrastructure maintenance.",
  },
  {
    id: 2,
    legal_name: "Nova FinTech Corporation",
    display_name: "Nova FinTech",
    address: "Bandra Kurla Complex, Bandra East, Mumbai",
    state: "Maharashtra",
    state_code: "27",
    country: "India",
    gstin: "27AABCN5678B1Z2",
    pan: "AABCN5678B",
    billing_email: "finance@novafintech.com",
    signatory_name: "Pooja Mehta",
    signatory_designation: "VP of Engineering",
    notes: "Requires bi-weekly sprint invoice delivery with SAC 998314.",
  },
  {
    id: 3,
    legal_name: "Kolkata Digital Retail Ventures LLP",
    display_name: "Kolkata Retail",
    address: "Park Street, 3rd Floor, Commercial Arcade, Kolkata",
    state: "West Bengal",
    state_code: "19",
    country: "India",
    gstin: "19AABCK9988C1Z9",
    pan: "AABCK9988C",
    billing_email: "billing@kolkataretail.in",
    signatory_name: "Sourav Ganguly",
    signatory_designation: "Managing Partner",
    notes: "Intra-state client (CGST + SGST apply).",
  },
  {
    id: 4,
    legal_name: "Global Scale Innovations Inc",
    display_name: "Global Scale (USA)",
    address: "1209 Orange Street, Wilmington, Delaware 19801",
    state: "Outside India",
    state_code: "96",
    country: "United States",
    billing_email: "ap@globalscale.us",
    signatory_name: "David Miller",
    signatory_designation: "Managing Director",
    notes: "Export of services under Letter of Undertaking (LUT). 0% GST.",
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 1,
    client_id: 1,
    name: "Enterprise Multi-Cloud Infrastructure",
    service_type: "DevOps & Cloud",
    description: "AWS to GCP architecture migration with Terraform automation",
    status: "active",
    client_legal_name: "Acme Cloud Solutions Pvt Ltd",
  },
  {
    id: 2,
    client_id: 2,
    name: "Mobile Banking React Native App",
    service_type: "Mobile Engineering",
    description: "Fintech mobile payment gateway and biometric auth integration",
    status: "active",
    client_legal_name: "Nova FinTech Corporation",
  },
  {
    id: 3,
    client_id: 3,
    name: "Omnichannel POS & Inventory Portal",
    service_type: "Full-Stack Development",
    description: "Next.js 16 retail checkout dashboard with barcode integration",
    status: "active",
    client_legal_name: "Kolkata Digital Retail Ventures LLP",
  },
];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 1,
    type: "invoice",
    doc_number: "INV/2026-27/0001",
    client_id: 1,
    project_id: 1,
    status: "paid",
    total_amount: 147500,
    amount_paid: 147500,
    payment_status: "paid",
    revision_no: 1,
    is_legacy: false,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    client_legal_name: "Acme Cloud Solutions Pvt Ltd",
    project_name: "Enterprise Multi-Cloud Infrastructure",
    input_data: {
      issue_date: "2026-09-24",
      due_date: "2026-10-09",
      subtotal: 125000,
      igst: 22500,
      total: 147500,
      currency: "INR",
      items: [
        {
          description: "Cloud Architecture Audit & Security Review",
          sac_code: "998315",
          quantity: 1,
          unit: "nos",
          rate: 125000,
          discount: 0,
          amount: 125000,
        },
      ],
    },
  },
  {
    id: 2,
    type: "invoice",
    doc_number: "INV/2026-27/0002",
    client_id: 2,
    project_id: 2,
    status: "sent",
    total_amount: 212400,
    amount_paid: 100000,
    payment_status: "partial",
    revision_no: 1,
    is_legacy: false,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    client_legal_name: "Nova FinTech Corporation",
    project_name: "Mobile Banking React Native App",
    input_data: {
      issue_date: "2026-10-09",
      due_date: "2026-10-24",
      subtotal: 180000,
      igst: 32400,
      total: 212400,
      currency: "INR",
      items: [
        {
          description: "Sprint 3: Native Biometrics & UPI Module",
          sac_code: "998314",
          quantity: 1,
          unit: "milestone",
          rate: 180000,
          discount: 0,
          amount: 180000,
        },
      ],
    },
  },
  {
    id: 3,
    type: "invoice",
    doc_number: "INV/2026-27/0003",
    client_id: 3,
    project_id: 3,
    status: "sent",
    total_amount: 88500,
    amount_paid: 0,
    payment_status: "unpaid",
    revision_no: 1,
    is_legacy: false,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    client_legal_name: "Kolkata Digital Retail Ventures LLP",
    project_name: "Omnichannel POS & Inventory Portal",
    input_data: {
      issue_date: "2026-10-16",
      due_date: "2026-10-31",
      subtotal: 75000,
      cgst: 6750,
      sgst: 6750,
      total: 88500,
      currency: "INR",
      items: [
        {
          description: "Retail Barcode Scanner API Integration",
          sac_code: "998314",
          quantity: 1,
          unit: "nos",
          rate: 75000,
          discount: 0,
          amount: 75000,
        },
      ],
    },
  },
  {
    id: 4,
    type: "sow",
    doc_number: "SOW/2026-27/001",
    client_id: 1,
    project_id: 1,
    status: "signed",
    revision_no: 2,
    is_legacy: false,
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
    client_legal_name: "Acme Cloud Solutions Pvt Ltd",
    project_name: "Enterprise Multi-Cloud Infrastructure",
    input_data: {
      title: "Statement of Work - Cloud Migration",
      effective_date: "2026-09-10",
      total_contract_value: 500000,
    },
  },
];

export const INITIAL_FINANCE_SUMMARY: FinanceSummary = {
  total_invoiced: 448400,
  total_collected: 247500,
  outstanding_receivables: 200900,
  overdue_amount: 0,
  paid_count: 1,
  partial_count: 1,
  unpaid_count: 1,
  overdue_count: 0,
  client_balances: [
    {
      client_id: 1,
      client_name: "Acme Cloud Solutions Pvt Ltd",
      total_invoiced: 147500,
      total_collected: 147500,
      outstanding_balance: 0,
      invoices_count: 1,
    },
    {
      client_id: 2,
      client_name: "Nova FinTech Corporation",
      total_invoiced: 212400,
      total_collected: 100000,
      outstanding_balance: 112400,
      invoices_count: 1,
    },
    {
      client_id: 3,
      client_name: "Kolkata Digital Retail Ventures LLP",
      total_invoiced: 88500,
      total_collected: 0,
      outstanding_balance: 88500,
      invoices_count: 1,
    },
  ],
};

// Local storage storage helper keys
const STORAGE_KEYS = {
  SETTINGS: "docforge_offline_settings",
  CLIENTS: "docforge_offline_clients",
  PROJECTS: "docforge_offline_projects",
  DOCS: "docforge_offline_documents",
  FINANCE: "docforge_offline_finance",
  IS_DEMO: "docforge_use_offline_demo",
};

export function getOfflineSettings(): CompanySettings {
  if (typeof window === "undefined") return DEFAULT_COMPANY_SETTINGS;
  const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return DEFAULT_COMPANY_SETTINGS;
}

export function saveOfflineSettings(settings: CompanySettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function getOfflineClients(): Client[] {
  if (typeof window === "undefined") return INITIAL_CLIENTS;
  const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
  return INITIAL_CLIENTS;
}

export function saveOfflineClient(client: Partial<Client>): Client {
  const clients = getOfflineClients();
  let updated: Client;
  if (client.id) {
    updated = { ...clients.find((c) => c.id === client.id)!, ...client } as Client;
    const nextList = clients.map((c) => (c.id === client.id ? updated : c));
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(nextList));
    }
  } else {
    const newId = Math.max(0, ...clients.map((c) => c.id)) + 1;
    updated = {
      id: newId,
      legal_name: client.legal_name || "New Client",
      display_name: client.display_name || client.legal_name || "New Client",
      address: client.address || "",
      state: client.state || "West Bengal",
      state_code: client.state_code || "19",
      country: client.country || "India",
      gstin: client.gstin || "",
      pan: client.pan || "",
      billing_email: client.billing_email || "",
      signatory_name: client.signatory_name || "",
      signatory_designation: client.signatory_designation || "",
      notes: client.notes || "",
      created_at: new Date().toISOString(),
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([updated, ...clients]));
    }
  }
  return updated;
}

export function getOfflineProjects(): Project[] {
  if (typeof window === "undefined") return INITIAL_PROJECTS;
  const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
  return INITIAL_PROJECTS;
}

export function getOfflineDocuments(docType?: string): DocumentItem[] {
  if (typeof window === "undefined") return INITIAL_DOCUMENTS;
  const raw = localStorage.getItem(STORAGE_KEYS.DOCS);
  let docs = INITIAL_DOCUMENTS;
  if (raw) {
    try {
      docs = JSON.parse(raw);
    } catch {
      docs = INITIAL_DOCUMENTS;
    }
  } else {
    localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(INITIAL_DOCUMENTS));
  }
  if (docType) {
    return docs.filter((d) => d.type === docType);
  }
  return docs;
}

export function saveOfflineInvoice(invoiceData: any): DocumentItem {
  const docs = getOfflineDocuments();
  const clients = getOfflineClients();
  const client = clients.find((c) => c.id === invoiceData.client_id);
  const newId = Math.max(0, ...docs.map((d) => d.id)) + 1;
  const docNumber =
    invoiceData.custom_doc_number || `INV/2026-27/${String(newId).padStart(4, "0")}`;

  const newInvoice: DocumentItem = {
    id: newId,
    type: "invoice",
    doc_number: docNumber,
    client_id: invoiceData.client_id,
    project_id: invoiceData.project_id,
    status: invoiceData.status || "sent",
    total_amount: invoiceData.total,
    amount_paid: invoiceData.status === "paid" ? invoiceData.total : 0,
    payment_status: invoiceData.status === "paid" ? "paid" : "unpaid",
    revision_no: 1,
    is_legacy: false,
    notes: invoiceData.notes,
    created_at: new Date().toISOString(),
    client_legal_name: client?.legal_name || "Client",
    input_data: invoiceData,
  };

  const updatedDocs = [newInvoice, ...docs];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(updatedDocs));
  }
  return newInvoice;
}

export function getOfflineFinanceSummary(): FinanceSummary {
  const docs = getOfflineDocuments("invoice");
  let total_invoiced = 0;
  let total_collected = 0;
  let paid_count = 0;
  let partial_count = 0;
  let unpaid_count = 0;

  docs.forEach((d) => {
    const total = d.total_amount || 0;
    const paid = d.amount_paid || 0;
    total_invoiced += total;
    total_collected += paid;
    if (d.payment_status === "paid" || paid >= total && total > 0) {
      paid_count++;
    } else if (paid > 0) {
      partial_count++;
    } else {
      unpaid_count++;
    }
  });

  return {
    total_invoiced,
    total_collected,
    outstanding_receivables: Math.max(0, total_invoiced - total_collected),
    overdue_amount: 0,
    paid_count,
    partial_count,
    unpaid_count,
    overdue_count: 0,
    client_balances: INITIAL_FINANCE_SUMMARY.client_balances,
  };
}
