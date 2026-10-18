"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { api, Client, Project, CompanySettings } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  Receipt,
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  Calendar,
  Landmark,
  Save,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react";

interface InvoiceItemRow {
  id: string;
  description: string;
  sac_code: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
}

const COMMON_SAC_CODES = [
  { code: "998314", label: "998314 - IT Software Design & Development" },
  { code: "998313", label: "998313 - IT Consulting & Advisory" },
  { code: "998315", label: "998315 - Hosting & Cloud Infrastructure" },
  { code: "998319", label: "998319 - Other IT & Technical Services" },
  { code: "998365", label: "998365 - Digital Marketing & SEO Services" },
  { code: "998311", label: "998311 - Management & Strategy Consulting" },
];

// Helper to convert number to Indian words
function numberToIndianWords(num: number): string {
  if (num === 0) return "Zero Rupees Only";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " and " + inWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + inWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 !== 0 ? " " + inWords(n % 100000) : "")
      );
    return (
      inWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "")
    );
  }

  const rounded = Math.round(num);
  return `INR ${inWords(rounded)} Only`;
}

export default function NewInvoicePage() {
  const router = useRouter();

  // Reference data
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Invoice header
  const [selectedClientId, setSelectedClientId] = useState<number | "">("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");
  const [customDocNumber, setCustomDocNumber] = useState("");
  const [useCustomNumber, setUseCustomNumber] = useState(false);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]
  );
  const [poReference, setPoReference] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [isExport, setIsExport] = useState(false);
  const [tdsRate, setTdsRate] = useState<number>(0);
  const [notes, setNotes] = useState("");

  // Line items
  const [items, setItems] = useState<InvoiceItemRow[]>([
    {
      id: "item-1",
      description: "Custom Web Application Development - Sprint 1",
      sac_code: "998314",
      quantity: 1,
      unit: "nos",
      rate: 75000,
      discount: 0,
    },
  ]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [cRes, pRes, sRes] = await Promise.all([
        api.get<Client[]>("/clients"),
        api.get<Project[]>("/projects"),
        api.get<CompanySettings>("/settings/company"),
      ]);
      setClients(cRes.data);
      setProjects(pRes.data);
      setCompany(sRes.data);

      if (sRes.data.invoice_footer) {
        setNotes(sRes.data.invoice_footer);
      }

      if (cRes.data.length > 0) {
        const firstClient = cRes.data[0];
        setSelectedClientId(firstClient.id);
        setPlaceOfSupply(firstClient.state || sRes.data.state || "West Bengal");
      }
    } catch (err) {
      console.error("Failed to load invoice setup data", err);
      setError("Failed to load clients and company settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (clientId: number | "") => {
    setSelectedClientId(clientId);
    if (!clientId) {
      setPlaceOfSupply("");
      return;
    }
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setPlaceOfSupply(client.state || "West Bengal");
    }
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const filteredProjects = projects.filter(
    (p) => !selectedClientId || p.client_id === selectedClientId
  );

  // Check intra-state vs inter-state
  // Default company state code: 19 (West Bengal)
  const companyStateCode = company?.state_code || "19";
  const clientStateCode = selectedClient?.state_code || "19";
  const isInterstate = !isExport && companyStateCode !== clientStateCode;

  // Items calculation
  const addItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        description: "",
        sac_code: "998314",
        quantity: 1,
        unit: "nos",
        rate: 0,
        discount: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((it) => it.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItemRow, val: any) => {
    setItems(
      items.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  // Financial totals
  const subtotal = items.reduce((sum, it) => {
    const raw = (it.quantity || 0) * (it.rate || 0);
    const disc = raw * ((it.discount || 0) / 100);
    return sum + (raw - disc);
  }, 0);

  const discountTotal = items.reduce((sum, it) => {
    const raw = (it.quantity || 0) * (it.rate || 0);
    return sum + raw * ((it.discount || 0) / 100);
  }, 0);

  // GST rates
  const taxRatePercent = isExport ? 0 : (company?.default_tax_rate ?? 18);
  const cgstRate = isInterstate || isExport ? 0 : taxRatePercent / 2;
  const sgstRate = isInterstate || isExport ? 0 : taxRatePercent / 2;
  const igstRate = isInterstate ? taxRatePercent : 0;

  const cgstAmount = (subtotal * cgstRate) / 100;
  const sgstAmount = (subtotal * sgstRate) / 100;
  const igstAmount = (subtotal * igstRate) / 100;
  const totalTax = cgstAmount + sgstAmount + igstAmount;

  const tdsAmount = (subtotal * tdsRate) / 100;
  const grandTotal = Math.max(0, subtotal + totalTax - tdsAmount);
  const amountWords = numberToIndianWords(grandTotal);

  const handleSubmit = async (targetStatus: "draft" | "sent" | "paid") => {
    if (!selectedClientId) {
      setError("Please select a client for this invoice.");
      return;
    }
    if (items.some((it) => !it.description.trim())) {
      setError("All line items must have a valid description.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        client_id: selectedClientId,
        project_id: selectedProjectId ? Number(selectedProjectId) : null,
        issue_date: issueDate,
        due_date: dueDate,
        currency: "INR",
        place_of_supply: placeOfSupply,
        is_interstate: isInterstate,
        is_export: isExport,
        custom_doc_number: useCustomNumber && customDocNumber.trim() ? customDocNumber.trim() : null,
        po_reference: poReference || null,
        notes: notes || null,
        subtotal,
        discount_total: discountTotal,
        cgst: cgstAmount,
        sgst: sgstAmount,
        igst: igstAmount,
        tds: tdsAmount,
        total: grandTotal,
        amount_in_words: amountWords,
        status: targetStatus,
        items: items.map((it) => {
          const raw = it.quantity * it.rate;
          const disc = raw * (it.discount / 100);
          return {
            description: it.description,
            sac_code: it.sac_code,
            quantity: it.quantity,
            unit: it.unit,
            rate: it.rate,
            discount: it.discount,
            tax_rate: taxRatePercent,
            amount: raw - disc,
          };
        }),
      };

      await api.post("/documents/invoice", payload);
      router.push("/invoices");
    } catch (err: any) {
      console.error("Failed to create invoice", err);
      setError(
        err.response?.data?.detail || "Failed to create invoice. Please check all fields."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Loading Tax Invoice builder...
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/invoices"
              className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
                  Create Tax Invoice
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  GST Compliant
                </span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Generate an invoice with SAC calculation, inter/intra-state tax split, and bank remittance.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] text-xs font-medium rounded-lg transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit("sent")}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "Processing..." : "Issue & Send"}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Form: 2 Cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Client & Dates */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Client & Billing Particulars</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Select Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) =>
                      handleClientChange(e.target.value ? Number(e.target.value) : "")
                    }
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Choose a Client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.legal_name} ({c.state || "State N/A"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Linked Project (Optional)
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) =>
                      setSelectedProjectId(e.target.value ? Number(e.target.value) : "")
                    }
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- General / No Project --</option>
                    {filteredProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Payment Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Client Details Preview Card */}
              {selectedClient && (
                <div className="p-3 bg-[var(--muted)]/40 border border-[var(--border)] rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--foreground)]">
                      {selectedClient.legal_name}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-medium">
                      State Code: {selectedClient.state_code || "19"} ({selectedClient.state})
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">
                    {selectedClient.address}
                  </div>
                  <div className="flex gap-4 text-[11px] text-[var(--muted-foreground)] pt-1">
                    <span>GSTIN: <strong className="text-[var(--foreground)] font-mono">{selectedClient.gstin || "Unregistered"}</strong></span>
                    <span>PAN: <strong className="text-[var(--foreground)] font-mono">{selectedClient.pan || "N/A"}</strong></span>
                  </div>
                </div>
              )}

              {/* Numbering and PO reference */}
              <div className="pt-2 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[var(--foreground)]">
                      Invoice Sequence
                    </label>
                    <button
                      type="button"
                      onClick={() => setUseCustomNumber(!useCustomNumber)}
                      className="text-[10px] text-indigo-600 hover:underline"
                    >
                      {useCustomNumber ? "Use Auto Sequence" : "Custom Identifier"}
                    </button>
                  </div>
                  {useCustomNumber ? (
                    <input
                      type="text"
                      placeholder="e.g. INV/2026-27/0099"
                      value={customDocNumber}
                      onChange={(e) => setCustomDocNumber(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  ) : (
                    <div className="text-xs px-3 py-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] flex items-center justify-between">
                      <span className="font-mono">INV/2026-27/[AUTO]</span>
                      <span className="text-[10px] text-indigo-600 font-medium">Atomic Lock</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Client PO / Contract Ref (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PO-78901 / SOW-2026-004"
                    value={poReference}
                    onChange={(e) => setPoReference(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Line Items */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Invoice Line Items</span>
                </h2>

                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md transition-colors dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => {
                  const lineAmount =
                    (item.quantity || 0) *
                    (item.rate || 0) *
                    (1 - (item.discount || 0) / 100);

                  return (
                    <div
                      key={item.id}
                      className="p-3 border border-[var(--border)] rounded-lg bg-[var(--background)]/60 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <label className="block text-[11px] font-semibold text-[var(--muted-foreground)] mb-1">
                            Item #{index + 1} Description <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Full-Stack Web Development, Architecture consulting..."
                            value={item.description}
                            onChange={(e) =>
                              updateItem(item.id, "description", e.target.value)
                            }
                            className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="w-48 shrink-0">
                          <label className="block text-[11px] font-semibold text-[var(--muted-foreground)] mb-1">
                            SAC / HSN Code
                          </label>
                          <select
                            value={item.sac_code}
                            onChange={(e) =>
                              updateItem(item.id, "sac_code", e.target.value)
                            }
                            className="w-full text-xs px-2.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                          >
                            {COMMON_SAC_CODES.map((s) => (
                              <option key={s.code} value={s.code}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            title="Remove row"
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-6 dark:hover:bg-red-950/50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        <div>
                          <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-1">
                            Unit
                          </label>
                          <select
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="nos">nos (deliverable)</option>
                            <option value="hours">hours</option>
                            <option value="days">days</option>
                            <option value="milestone">milestone</option>
                            <option value="month">month</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-1">
                            Rate (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.rate}
                            onChange={(e) =>
                              updateItem(item.id, "rate", parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-1">
                            Total (₹)
                          </label>
                          <div className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 text-[var(--foreground)] font-mono font-semibold flex items-center justify-between">
                            <span>{formatCurrency(lineAmount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Notes & Terms */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-3">
              <label className="block text-xs font-semibold text-[var(--foreground)]">
                Invoice Footer & Payment Instructions
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bank transfer instructions, late payment terms, etc."
                className="w-full text-xs p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Right Summary Column: 1 Col */}
          <div className="space-y-6">
            {/* Tax Regime & Breakdown Card */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  GST Calculation
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    isInterstate
                      ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                      : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  }`}
                >
                  {isExport
                    ? "Export / LUT"
                    : isInterstate
                    ? "Inter-State (IGST)"
                    : "Intra-State (CGST+SGST)"}
                </span>
              </div>

              {/* Export / LUT Toggle */}
              <label className="flex items-center gap-2 p-2 rounded-lg bg-[var(--muted)]/40 cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={isExport}
                  onChange={(e) => setIsExport(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-[var(--foreground)]">
                  Export / SEZ Supply under LUT (0% Tax)
                </span>
              </label>

              {/* TDS Option */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--muted-foreground)] mb-1">
                  Client TDS Deduction (Under Sec 194J / 194C)
                </label>
                <select
                  value={tdsRate}
                  onChange={(e) => setTdsRate(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={0}>No TDS Deduction (0%)</option>
                  <option value={1}>1% (Individual/HUF contractor)</option>
                  <option value={2}>2% (Technical services under 194J)</option>
                  <option value={10}>10% (Professional fees under 194J)</option>
                </select>
              </div>

              {/* Breakdown lines */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)] text-xs">
                <div className="flex items-center justify-between text-[var(--muted-foreground)]">
                  <span>Taxable Subtotal</span>
                  <span className="font-mono text-[var(--foreground)] font-medium">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                {!isExport && !isInterstate && (
                  <>
                    <div className="flex items-center justify-between text-[var(--muted-foreground)]">
                      <span>CGST ({cgstRate}%)</span>
                      <span className="font-mono text-[var(--foreground)]">
                        {formatCurrency(cgstAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--muted-foreground)]">
                      <span>SGST ({sgstRate}%)</span>
                      <span className="font-mono text-[var(--foreground)]">
                        {formatCurrency(sgstAmount)}
                      </span>
                    </div>
                  </>
                )}

                {!isExport && isInterstate && (
                  <div className="flex items-center justify-between text-[var(--muted-foreground)]">
                    <span>IGST ({igstRate}%)</span>
                    <span className="font-mono text-[var(--foreground)]">
                      {formatCurrency(igstAmount)}
                    </span>
                  </div>
                )}

                {tdsAmount > 0 && (
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                    <span>TDS Deducted ({tdsRate}%)</span>
                    <span className="font-mono">- {formatCurrency(tdsAmount)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="font-bold text-sm text-[var(--foreground)]">
                    Grand Total
                  </span>
                  <span className="font-bold text-base text-indigo-600 dark:text-indigo-400 font-mono">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Amount in words */}
              <div className="p-3 bg-[var(--muted)]/40 rounded-lg border border-[var(--border)]">
                <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] tracking-wider block mb-0.5">
                  Amount in Words
                </span>
                <p className="text-[11px] font-medium text-[var(--foreground)] italic">
                  {amountWords}
                </p>
              </div>
            </div>

            {/* Bank Particulars Card */}
            {company && (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-2">
                  <Landmark className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Remittance Particulars</span>
                </span>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Account Name:</span>
                    <span className="font-medium text-[var(--foreground)] text-right">
                      {company.bank_account_name || company.legal_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Bank:</span>
                    <span className="font-medium text-[var(--foreground)]">
                      {company.bank_name || "HDFC Bank"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Account No:</span>
                    <span className="font-mono text-[var(--foreground)] font-semibold">
                      {company.bank_account_no}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">IFSC Code:</span>
                    <span className="font-mono text-[var(--foreground)] font-semibold">
                      {company.bank_ifsc}
                    </span>
                  </div>
                  {company.upi_id && (
                    <div className="flex justify-between pt-1 border-t border-[var(--border)]">
                      <span className="text-[var(--muted-foreground)]">UPI VPA:</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                        {company.upi_id}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSubmit("sent")}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "Creating Invoice..." : "Create & Issue Invoice"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmit("paid")}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Record as Directly Paid</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
