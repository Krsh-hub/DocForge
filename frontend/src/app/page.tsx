"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Receipt,
  Users,
  Briefcase,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  CreditCard,
  Download,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { api, CompanySettings, FinanceSummary, DocumentItem, API_BASE_URL } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [recentDocs, setRecentDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<CompanySettings>("/settings/company"),
      api.get<FinanceSummary>("/finance/summary"),
      api.get<DocumentItem[]>("/documents"),
    ])
      .then(([cRes, fRes, dRes]) => {
        setCompany(cRes.data);
        setFinance(fRes.data);
        setRecentDocs(dRes.data.slice(0, 5));
      })
      .catch((err) => console.error("Error loading dashboard metrics", err))
      .finally(() => setLoading(false));
  }, []);

  const sowCount = recentDocs.filter((d) => d.type === "sow" && d.status !== "signed").length;

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 to-indigo-700 dark:from-indigo-950 dark:to-slate-900 rounded-2xl p-6 text-white shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>DocForge Local Enterprise</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {company?.trade_name || company?.legal_name || "DocForge Workspace"}
            </h1>
            <p className="text-xs text-indigo-100 mt-1 max-w-xl">
              Internal business engine for Statements of Work, client milestone tracking, and GST-compliant finance management.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-all border border-indigo-400/30"
            >
              <Receipt className="w-4 h-4" />
              <span>Create Invoice</span>
            </Link>
            <Link
              href="/documents/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Document</span>
            </Link>
          </div>
        </div>

        {/* Live Executive Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">Total Invoiced</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg dark:bg-indigo-950 dark:text-indigo-400">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold tracking-tight text-[var(--foreground)] font-mono">
                {formatCurrency(finance?.total_invoiced || 0)}
              </div>
              <span className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1 mt-1">
                <span>Total billings across all accounts</span>
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
                {formatCurrency(finance?.total_collected || 0)}
              </div>
              <span className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1 mt-1">
                <span>{finance?.paid_count || 0} fully settled invoices</span>
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
                {formatCurrency(finance?.outstanding_receivables || 0)}
              </div>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                <span>{finance?.overdue_count || 0} overdue invoices</span>
              </span>
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">Contracts & SOWs</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg dark:bg-blue-950 dark:text-blue-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold tracking-tight text-[var(--foreground)] font-mono">
                {recentDocs.length}
              </div>
              <span className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1 mt-1">
                <span>Active documents in repository</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Launch & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1 bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Quick Actions</h2>
            <div className="space-y-2.5">
              <Link
                href="/invoices"
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:border-indigo-400 hover:bg-[var(--muted)]/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--foreground)] group-hover:text-indigo-600">
                      Payment & Finance Hub
                    </div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">Record payments & view receipts</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-indigo-600" />
              </Link>

              <Link
                href="/documents/new?type=sow"
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:border-indigo-400 hover:bg-[var(--muted)]/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--foreground)] group-hover:text-indigo-600">
                      Statement of Work (SOW)
                    </div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">Milestones & clause picker</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-indigo-600" />
              </Link>

              <Link
                href="/documents/import-existing"
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:border-indigo-400 hover:bg-[var(--muted)]/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--foreground)] group-hover:text-blue-600">
                      Record Historic Order
                    </div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">Import past books & signed copies</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-blue-600" />
              </Link>

              <Link
                href="/invoices/new"
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:border-indigo-400 hover:bg-[var(--muted)]/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--foreground)] group-hover:text-emerald-600">
                      Tax Invoice
                    </div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">GST & SAC calculation</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-emerald-600" />
              </Link>
            </div>
          </div>

          {/* Recent Documents Live Table */}
          <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Recent Documents & Orders</h2>
              <Link href="/documents" className="text-xs text-indigo-600 hover:underline font-medium">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
                Loading repository...
              </div>
            ) : recentDocs.length === 0 ? (
              <div className="border border-[var(--border)] rounded-lg p-8 text-center bg-[var(--background)]/50">
                <FileText className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium text-[var(--foreground)]">No documents generated yet</p>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                  Start by configuring your templates or creating your first Statement of Work.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-b border-[var(--border)]">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Document #</th>
                      <th className="py-2.5 px-3 font-semibold">Type</th>
                      <th className="py-2.5 px-3 font-semibold">Client</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {recentDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-[var(--foreground)]">
                          {doc.doc_number}
                        </td>
                        <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-[var(--muted-foreground)]">
                          {doc.type}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[var(--foreground)]">
                          {doc.client_legal_name || "—"}
                        </td>
                        <td className="py-2.5 px-3 capitalize">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {doc.pdf_path ? (
                            <a
                              href={`${API_BASE_URL}${doc.pdf_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              <Download className="w-3 h-3" />
                              <span>PDF</span>
                            </a>
                          ) : (
                            <Link href="/documents" className="text-slate-400 hover:text-indigo-600">
                              View
                            </Link>
                          )}
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
    </AppShell>
  );
}
