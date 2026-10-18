"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  api,
  DocumentItem,
  PaymentItem,
  FinanceSummary,
  InvoicePaymentSummary,
  API_BASE_URL,
} from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  Receipt,
  Plus,
  Search,
  Eye,
  Download,
  Clock,
  CheckCircle2,
  Send,
  AlertCircle,
  ArrowUpRight,
  FileText,
  Filter,
  TrendingUp,
  IndianRupee,
  X,
  Trash2,
  Building2,
  Calendar,
  Landmark,
  Check,
  CreditCard,
  History,
  Users,
  ChevronRight,
  ArrowDownRight,
  DollarSign,
} from "lucide-react";

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<"invoices" | "payments" | "balances">("invoices");

  // Invoices data
  const [invoices, setInvoices] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Finance summary data
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);

  // Global payments ledger data
  const [paymentsLedger, setPaymentsLedger] = useState<PaymentItem[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Modals & Action States
  const [selectedInvoice, setSelectedInvoice] = useState<DocumentItem | null>(null);
  const [invoicePayments, setInvoicePayments] = useState<PaymentItem[]>([]);
  const [loadingInvoicePayments, setLoadingInvoicePayments] = useState(false);

  // Record Payment Modal State
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<DocumentItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentMode, setPaymentMode] = useState<string>("bank_transfer");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [successToast, setSuccessToast] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [invRes, finRes] = await Promise.all([
        api.get<DocumentItem[]>("/documents", { params: { doc_type: "invoice" } }),
        api.get<FinanceSummary>("/finance/summary"),
      ]);
      setInvoices(invRes.data);
      setFinanceSummary(finRes.data);
    } catch (err) {
      console.error("Failed to load invoice/finance data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentsLedger = async () => {
    setLoadingPayments(true);
    try {
      const res = await api.get<PaymentItem[]>("/payments");
      setPaymentsLedger(res.data);
    } catch (err) {
      console.error("Failed to load payments ledger", err);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (activeTab === "payments") {
      fetchPaymentsLedger();
    }
  }, [activeTab]);

  const loadInvoicePayments = async (invoiceId: number) => {
    setLoadingInvoicePayments(true);
    try {
      const res = await api.get<PaymentItem[]>(`/invoices/${invoiceId}/payments`);
      setInvoicePayments(res.data);
    } catch (err) {
      console.error("Failed to fetch payments for invoice", err);
    } finally {
      setLoadingInvoicePayments(false);
    }
  };

  const handleOpenDetails = (inv: DocumentItem) => {
    setSelectedInvoice(inv);
    loadInvoicePayments(inv.id);
  };

  const handleOpenRecordPayment = (inv: DocumentItem) => {
    const total = inv.total_amount ?? inv.input_data?.total_amount ?? 0;
    const paid = inv.amount_paid ?? 0;
    const balanceDue = Math.max(0, Number(total) - Number(paid));

    setPaymentModalInvoice(inv);
    setPaymentAmount(balanceDue);
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentMode("bank_transfer");
    setPaymentReference("");
    setPaymentNotes("");
    setPaymentError("");
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;

    if (paymentAmount <= 0) {
      setPaymentError("Payment amount must be greater than zero.");
      return;
    }

    setSubmittingPayment(true);
    setPaymentError("");

    try {
      await api.post(`/invoices/${paymentModalInvoice.id}/payments`, {
        amount: paymentAmount,
        date: paymentDate,
        mode: paymentMode,
        reference: paymentReference.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
      });

      setSuccessToast(`Payment of ${formatCurrency(paymentAmount)} recorded successfully!`);
      setTimeout(() => setSuccessToast(""), 3500);

      // Close modal
      setPaymentModalInvoice(null);

      // Refresh data
      await loadAllData();
      if (selectedInvoice && selectedInvoice.id === paymentModalInvoice.id) {
        // Refresh details modal
        const refreshedDoc = await api.get<DocumentItem>(`/documents/${paymentModalInvoice.id}`);
        setSelectedInvoice(refreshedDoc.data);
        await loadInvoicePayments(paymentModalInvoice.id);
      }
      if (activeTab === "payments") {
        await fetchPaymentsLedger();
      }
    } catch (err: any) {
      setPaymentError(err.response?.data?.detail || "Failed to record payment.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!selectedInvoice) return;
    if (!confirm("Are you sure you want to delete this payment record? This will restore the outstanding balance.")) return;

    setActionLoadingId(paymentId);
    try {
      await api.delete(`/invoices/${selectedInvoice.id}/payments/${paymentId}`);
      setSuccessToast("Payment record deleted and invoice balance restored.");
      setTimeout(() => setSuccessToast(""), 3000);

      await loadAllData();
      const refreshedDoc = await api.get<DocumentItem>(`/documents/${selectedInvoice.id}`);
      setSelectedInvoice(refreshedDoc.data);
      await loadInvoicePayments(selectedInvoice.id);
      if (activeTab === "payments") {
        await fetchPaymentsLedger();
      }
    } catch (err: any) {
      console.error("Failed to delete payment", err);
      alert(err.response?.data?.detail || "Failed to delete payment.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    if (!confirm("Are you sure you want to delete this invoice and all associated records?")) return;
    setActionLoadingId(invoiceId);
    try {
      await api.delete(`/documents/${invoiceId}`);
      setInvoices(invoices.filter((inv) => inv.id !== invoiceId));
      if (selectedInvoice?.id === invoiceId) {
        setSelectedInvoice(null);
      }
      setSuccessToast("Invoice deleted successfully");
      setTimeout(() => setSuccessToast(""), 3000);
      loadAllData();
    } catch (err) {
      console.error("Failed to delete invoice", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchesSearch =
      inv.doc_number.toLowerCase().includes(q) ||
      (inv.client_legal_name && inv.client_legal_name.toLowerCase().includes(q));
    const effectiveStatus = inv.payment_status || inv.status;
    const matchesStatus = filterStatus === "all" || effectiveStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusConfig: Record<string, { icon: React.ElementType; classes: string; label: string }> = {
    draft: {
      icon: FileText,
      label: "Draft",
      classes: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800",
    },
    sent: {
      icon: Send,
      label: "Sent",
      classes: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    },
    unpaid: {
      icon: Clock,
      label: "Unpaid",
      classes: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    },
    partial: {
      icon: TrendingUp,
      label: "Partial",
      classes: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800",
    },
    paid: {
      icon: CheckCircle2,
      label: "Paid",
      classes: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    },
    overdue: {
      icon: AlertCircle,
      label: "Overdue",
      classes: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    },
  };

  const modeLabels: Record<string, string> = {
    bank_transfer: "Bank Transfer (NEFT/RTGS/IMPS)",
    upi: "UPI / QR",
    cheque: "Cheque",
    cash: "Cash",
    other: "Other",
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              <span>Finance & Invoicing Hub</span>
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Track invoices, milestone advance payments, UTR references, and client accounts receivable.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Invoice</span>
            </Link>
          </div>
        </div>

        {successToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Live Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">Total Invoiced</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg dark:bg-indigo-950 dark:text-indigo-400">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold tracking-tight text-[var(--foreground)] font-mono">
                {formatCurrency(financeSummary?.total_invoiced || 0)}
              </div>
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {invoices.length} invoices generated
              </span>
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">Payments Collected</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(financeSummary?.total_collected || 0)}
              </div>
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {financeSummary?.paid_count || 0} fully settled invoices
              </span>
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">Outstanding Receivables</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg dark:bg-amber-950 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
                {formatCurrency(financeSummary?.outstanding_receivables || 0)}
              </div>
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {(financeSummary?.partial_count || 0) + (financeSummary?.unpaid_count || 0)} awaiting payment
              </span>
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">Overdue Balance</span>
              <div className="p-2 bg-red-50 text-red-600 rounded-lg dark:bg-red-950 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold tracking-tight text-red-600 dark:text-red-400 font-mono">
                {formatCurrency(financeSummary?.overdue_amount || 0)}
              </div>
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {financeSummary?.overdue_count || 0} overdue invoices
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="border-b border-[var(--border)] flex items-center gap-6">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "invoices"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Invoices & Receivables</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--muted)] text-[var(--foreground)]">
              {invoices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("payments")}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "payments"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Payment Receipts Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab("balances")}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "balances"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Client Balances ({financeSummary?.client_balances.length || 0})</span>
          </button>
        </div>

        {/* Tab 1: Invoices Table */}
        {activeTab === "invoices" && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden space-y-0">
            {/* Controls */}
            <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  placeholder="Search invoice # or client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[11px] font-medium text-[var(--muted-foreground)]">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="sent">Sent</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-[var(--muted-foreground)]">
                Loading invoices...
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="w-10 h-10 text-[var(--muted-foreground)] mx-auto mb-3 opacity-40" />
                <p className="text-sm font-semibold text-[var(--foreground)]">No invoices found</p>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                  Create a new GST-compliant tax invoice to start tracking payments.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-b border-[var(--border)]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Invoice #</th>
                      <th className="py-2.5 px-4 font-semibold">Client</th>
                      <th className="py-2.5 px-4 font-semibold">Total Amount</th>
                      <th className="py-2.5 px-4 font-semibold">Paid Amount</th>
                      <th className="py-2.5 px-4 font-semibold">Balance Due</th>
                      <th className="py-2.5 px-4 font-semibold">Status</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredInvoices.map((inv) => {
                      const total = Number(inv.total_amount ?? inv.input_data?.total_amount ?? 0);
                      const paid = Number(inv.amount_paid ?? (inv.status === "paid" ? total : 0));
                      const balance = Math.max(0, total - paid);
                      const effectiveStatus = inv.payment_status || inv.status;
                      const cfg = statusConfig[effectiveStatus] || statusConfig.sent;
                      const StatusIcon = cfg.icon;

                      return (
                        <tr key={inv.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                          <td className="py-3 px-4 font-mono font-semibold text-[var(--foreground)]">
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(inv)}
                              className="hover:text-indigo-600 hover:underline font-mono text-left"
                            >
                              {inv.doc_number}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[var(--foreground)]">
                              {inv.client_legal_name || "—"}
                            </div>
                            {inv.project_name && (
                              <div className="text-[11px] text-[var(--muted-foreground)]">
                                {inv.project_name}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[var(--foreground)] font-mono">
                            {formatCurrency(total)}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                            {formatCurrency(paid)}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold">
                            {balance > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400">
                                {formatCurrency(balance)}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">₹0.00</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${cfg.classes}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              <span>{cfg.label}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Record Payment Button */}
                              {balance > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRecordPayment(inv)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold rounded-md transition-colors dark:bg-indigo-950 dark:text-indigo-300"
                                  title="Record Payment"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Pay</span>
                                </button>
                              )}

                              {/* View Details Modal */}
                              <button
                                type="button"
                                onClick={() => handleOpenDetails(inv)}
                                className="p-1.5 rounded-md hover:bg-[var(--muted)] text-[var(--foreground)]"
                                title="View Details & Payments"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Download PDF/DOCX if available */}
                              {inv.pdf_path && (
                                <a
                                  href={`${API_BASE_URL}${inv.pdf_path}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-md hover:bg-[var(--muted)] text-indigo-600 dark:text-indigo-400"
                                  title="Download PDF"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteInvoice(inv.id)}
                                disabled={actionLoadingId === inv.id}
                                className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors dark:hover:bg-red-950/40"
                                title="Delete Invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Global Payment Receipts Ledger */}
        {activeTab === "payments" && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">Payments Ledger</h3>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Complete audit trail of all remittances, bank transfers, UPI transactions, and receipts.
                </p>
              </div>
            </div>

            {loadingPayments ? (
              <div className="p-12 text-center text-xs text-[var(--muted-foreground)]">
                Loading payments ledger...
              </div>
            ) : paymentsLedger.length === 0 ? (
              <div className="p-12 text-center">
                <History className="w-10 h-10 text-[var(--muted-foreground)] mx-auto mb-3 opacity-40" />
                <p className="text-sm font-semibold text-[var(--foreground)]">No payments recorded yet</p>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                  Payments recorded against invoices will appear here in chronological order.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-b border-[var(--border)]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Date</th>
                      <th className="py-2.5 px-4 font-semibold">Invoice #</th>
                      <th className="py-2.5 px-4 font-semibold">Client</th>
                      <th className="py-2.5 px-4 font-semibold">Payment Mode</th>
                      <th className="py-2.5 px-4 font-semibold">Reference / UTR</th>
                      <th className="py-2.5 px-4 font-semibold">Notes</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Amount Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {paymentsLedger.map((pmt) => (
                      <tr key={pmt.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-[var(--foreground)]">
                          {new Date(pmt.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                          {pmt.invoice_doc_number || `INV-${pmt.invoice_id}`}
                        </td>
                        <td className="py-3 px-4 font-medium text-[var(--foreground)]">
                          {pmt.client_legal_name || "—"}
                        </td>
                        <td className="py-3 px-4 capitalize">
                          <span className="px-2 py-0.5 rounded bg-[var(--muted)] font-medium text-[11px]">
                            {modeLabels[pmt.mode] || pmt.mode}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[var(--muted-foreground)]">
                          {pmt.reference || "—"}
                        </td>
                        <td className="py-3 px-4 text-[var(--muted-foreground)] max-w-xs truncate">
                          {pmt.notes || "—"}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right">
                          {formatCurrency(pmt.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Client Outstanding Balances */}
        {activeTab === "balances" && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Accounts Receivable by Client</h3>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Net financial exposure and collection progress for each customer account.
              </p>
            </div>

            {(!financeSummary || financeSummary.client_balances.length === 0) ? (
              <div className="p-12 text-center text-xs text-[var(--muted-foreground)]">
                No client financial data available yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-b border-[var(--border)]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Client Name</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Invoices Count</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Total Invoiced</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Total Collected</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Outstanding Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {financeSummary.client_balances.map((cb) => (
                      <tr key={cb.client_id} className="hover:bg-[var(--muted)]/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-[var(--foreground)]">
                          {cb.client_name}
                        </td>
                        <td className="py-3 px-4 text-right text-[var(--muted-foreground)]">
                          {cb.invoices_count}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[var(--foreground)]">
                          {formatCurrency(cb.total_invoiced)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                          {formatCurrency(cb.total_collected)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {Number(cb.outstanding_balance) > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400">
                              {formatCurrency(cb.outstanding_balance)}
                            </span>
                          ) : (
                            <span className="text-emerald-600">Settled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg dark:bg-indigo-950 dark:text-indigo-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--foreground)]">Record Payment</h3>
                  <p className="text-[11px] text-[var(--muted-foreground)] font-mono">
                    {paymentModalInvoice.doc_number} • {paymentModalInvoice.client_legal_name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPaymentModalInvoice(null)}
                className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {paymentError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Invoice Balance Snapshot */}
            <div className="bg-[var(--background)] p-3.5 rounded-xl border border-[var(--border)] grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-[var(--muted-foreground)] block">Invoice Total</span>
                <span className="font-mono font-semibold text-[var(--foreground)]">
                  {formatCurrency(paymentModalInvoice.total_amount ?? paymentModalInvoice.input_data?.total_amount ?? 0)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--muted-foreground)] block">Paid So Far</span>
                <span className="font-mono font-medium text-emerald-600">
                  {formatCurrency(paymentModalInvoice.amount_paid ?? 0)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--muted-foreground)] block">Balance Due</span>
                <span className="font-mono font-bold text-amber-600">
                  {formatCurrency(
                    Math.max(
                      0,
                      Number(paymentModalInvoice.total_amount ?? paymentModalInvoice.input_data?.total_amount ?? 0) -
                        Number(paymentModalInvoice.amount_paid ?? 0)
                    )
                  )}
                </span>
              </div>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[var(--foreground)] mb-1">
                  Payment Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--foreground)] mb-1">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--foreground)] mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="upi">UPI / QR Code</option>
                    <option value="cheque">Cheque</option>
                    <option value="cash">Cash</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--foreground)] mb-1">
                  UTR / Reference / Transaction ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC00012345678 or UPI-TXN-998877"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--foreground)] mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Milestone 1 advance settlement"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Calculated New Balance */}
              <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/50 flex items-center justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">Remaining Balance After Payment:</span>
                <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                  {formatCurrency(
                    Math.max(
                      0,
                      Number(paymentModalInvoice.total_amount ?? paymentModalInvoice.input_data?.total_amount ?? 0) -
                        Number(paymentModalInvoice.amount_paid ?? 0) -
                        paymentAmount
                    )
                  )}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{submittingPayment ? "Recording..." : "Record Payment"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Details & Payment History Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[var(--foreground)] font-mono">
                      {selectedInvoice.doc_number}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                        statusConfig[selectedInvoice.payment_status || selectedInvoice.status]?.classes || ""
                      }`}
                    >
                      {statusConfig[selectedInvoice.payment_status || selectedInvoice.status]?.label || selectedInvoice.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">Tax Invoice & Payment Ledger</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Client & Metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-[var(--background)] p-4 rounded-xl border border-[var(--border)]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] tracking-wider">
                  Billed To
                </span>
                <p className="font-bold text-[var(--foreground)] mt-0.5">
                  {selectedInvoice.client_legal_name || selectedInvoice.input_data?.client_name || "—"}
                </p>
                {selectedInvoice.input_data?.client_address && (
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                    {selectedInvoice.input_data.client_address}
                  </p>
                )}
                {selectedInvoice.input_data?.client_gstin && (
                  <p className="text-[11px] font-mono text-[var(--muted-foreground)] mt-1">
                    GSTIN: <strong className="text-[var(--foreground)]">{selectedInvoice.input_data.client_gstin}</strong>
                  </p>
                )}
              </div>

              <div className="space-y-1 text-right">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] tracking-wider">
                    Issue Date:
                  </span>
                  <span className="font-medium text-[var(--foreground)] ml-2">
                    {selectedInvoice.input_data?.issue_date ||
                      new Date(selectedInvoice.created_at).toISOString().split("T")[0]}
                  </span>
                </div>
                {selectedInvoice.input_data?.due_date && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] tracking-wider">
                      Due Date:
                    </span>
                    <span className="font-medium text-[var(--foreground)] ml-2">
                      {selectedInvoice.input_data.due_date}
                    </span>
                  </div>
                )}
                {selectedInvoice.input_data?.place_of_supply && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] tracking-wider">
                      Place of Supply:
                    </span>
                    <span className="font-medium text-[var(--foreground)] ml-2">
                      {selectedInvoice.input_data.place_of_supply}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items */}
            {selectedInvoice.input_data?.items && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Particulars & SAC Codes
                </h4>
                <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-b border-[var(--border)]">
                      <tr>
                        <th className="py-2 px-3">Item</th>
                        <th className="py-2 px-3">SAC</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                        <th className="py-2 px-3 text-right">Rate</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {selectedInvoice.input_data.items.map((it: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-medium text-[var(--foreground)]">
                            {it.description}
                          </td>
                          <td className="py-2 px-3 font-mono text-[var(--muted-foreground)]">
                            {it.sac_code || "998314"}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {it.quantity} {it.unit}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {formatCurrency(it.rate)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-[var(--foreground)]">
                            {formatCurrency(it.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--border)] space-y-1.5 text-xs">
              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>Subtotal:</span>
                <span className="font-mono text-[var(--foreground)]">
                  {formatCurrency(selectedInvoice.input_data?.subtotal || selectedInvoice.input_data?.total_amount || 0)}
                </span>
              </div>
              {selectedInvoice.input_data?.cgst > 0 && (
                <div className="flex justify-between text-[var(--muted-foreground)]">
                  <span>CGST (9%):</span>
                  <span className="font-mono text-[var(--foreground)]">
                    {formatCurrency(selectedInvoice.input_data.cgst)}
                  </span>
                </div>
              )}
              {selectedInvoice.input_data?.sgst > 0 && (
                <div className="flex justify-between text-[var(--muted-foreground)]">
                  <span>SGST (9%):</span>
                  <span className="font-mono text-[var(--foreground)]">
                    {formatCurrency(selectedInvoice.input_data.sgst)}
                  </span>
                </div>
              )}
              {selectedInvoice.input_data?.igst > 0 && (
                <div className="flex justify-between text-[var(--muted-foreground)]">
                  <span>IGST (18%):</span>
                  <span className="font-mono text-[var(--foreground)]">
                    {formatCurrency(selectedInvoice.input_data.igst)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold border-t border-[var(--border)] pt-2 text-[var(--foreground)]">
                <span>Invoice Total:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(selectedInvoice.total_amount ?? selectedInvoice.input_data?.total_amount ?? 0)}
                </span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-emerald-600 pt-1">
                <span>Amount Paid:</span>
                <span className="font-mono">
                  {formatCurrency(selectedInvoice.amount_paid ?? 0)}
                </span>
              </div>
              <div className="flex justify-between text-xs font-bold text-amber-600">
                <span>Outstanding Balance:</span>
                <span className="font-mono">
                  {formatCurrency(
                    Math.max(
                      0,
                      Number(selectedInvoice.total_amount ?? selectedInvoice.input_data?.total_amount ?? 0) -
                        Number(selectedInvoice.amount_paid ?? 0)
                    )
                  )}
                </span>
              </div>
            </div>

            {/* Payments History Ledger Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Recorded Payments ({invoicePayments.length})</span>
                </h4>

                <button
                  type="button"
                  onClick={() => handleOpenRecordPayment(selectedInvoice)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold rounded-md transition-colors dark:bg-indigo-950 dark:text-indigo-300"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Payment</span>
                </button>
              </div>

              {loadingInvoicePayments ? (
                <div className="p-4 text-center text-xs text-[var(--muted-foreground)] border border-[var(--border)] rounded-xl">
                  Loading payments...
                </div>
              ) : invoicePayments.length === 0 ? (
                <div className="p-4 text-center text-xs text-[var(--muted-foreground)] border border-[var(--border)] rounded-xl bg-[var(--background)]">
                  No payment records logged yet. Click "Add Payment" to record a receipt.
                </div>
              ) : (
                <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-b border-[var(--border)]">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Mode</th>
                        <th className="py-2 px-3">UTR / Ref</th>
                        <th className="py-2 px-3">Notes</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {invoicePayments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 px-3 font-medium text-[var(--foreground)]">
                            {new Date(p.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-2 px-3 capitalize">
                            <span className="px-1.5 py-0.5 rounded bg-[var(--muted)] font-mono text-[10px]">
                              {p.mode}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-[var(--muted-foreground)]">
                            {p.reference || "—"}
                          </td>
                          <td className="py-2 px-3 text-[var(--muted-foreground)]">
                            {p.notes || "—"}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(p.id)}
                              disabled={actionLoadingId === p.id}
                              className="p-1 text-red-500 hover:bg-red-50 rounded dark:hover:bg-red-950"
                              title="Delete payment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
