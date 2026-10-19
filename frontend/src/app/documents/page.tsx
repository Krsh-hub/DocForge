"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { api, DocumentItem, API_BASE_URL } from "@/lib/api";
import { INITIAL_DOCUMENTS } from "@/lib/offline-data";
import {
  FileText,
  Plus,
  History,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
  FileCheck2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterLegacy, setFilterLegacy] = useState("all");

  const fetchDocs = async () => {
    try {
      const res = await api.get<DocumentItem[]>("/documents");
      setDocuments(res.data);
    } catch (err) {
      console.warn("Backend unavailable, loading local offline document repository:", err);
      const stored = typeof window !== "undefined" ? localStorage.getItem("docforge_offline_invoices") : null;
      const localInvs: DocumentItem[] = stored ? JSON.parse(stored) : [];
      const combined = [...localInvs, ...INITIAL_DOCUMENTS];
      setDocuments(combined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const filtered = documents.filter((doc) => {
    const matchesSearch =
      doc.doc_number.toLowerCase().includes(search.toLowerCase()) ||
      (doc.client_legal_name && doc.client_legal_name.toLowerCase().includes(search.toLowerCase())) ||
      (doc.project_name && doc.project_name.toLowerCase().includes(search.toLowerCase()));

    const matchesType = filterType === "all" || doc.type === filterType;
    const matchesLegacy =
      filterLegacy === "all" ||
      (filterLegacy === "legacy" && doc.is_legacy) ||
      (filterLegacy === "generated" && !doc.is_legacy);

    return matchesSearch && matchesType && matchesLegacy;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              Document Repository
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Statements of Work, NDAs, and historic orders with revision history and download archives.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Existing Order Import Button */}
            <Link
              href="/documents/import-existing"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-[var(--card)] hover:bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span>Record Existing Order</span>
            </Link>

            {/* New Document Generator Button */}
            <Link
              href="/documents/new"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate New Document</span>
            </Link>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--card)] p-3 rounded-xl border border-[var(--border)] shadow-sm">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by doc #, client, or project..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 sm:flex-none px-2.5 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
            >
              <option value="all">All Document Types</option>
              <option value="sow">Statements of Work (SOW)</option>
              <option value="nda">NDAs</option>
              <option value="invoice">Invoices</option>
            </select>

            <select
              value={filterLegacy}
              onChange={(e) => setFilterLegacy(e.target.value)}
              className="flex-1 sm:flex-none px-2.5 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
            >
              <option value="all">All Origins</option>
              <option value="generated">Generated</option>
              <option value="legacy">Historic Orders</option>
            </select>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-[var(--muted-foreground)]">
              Loading document index...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold text-[var(--foreground)]">No documents found</p>
              <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                Generate a contract from a template or record an existing order from your books.
              </p>
            </div>
          ) : (
            <div>
              {/* Mobile Cards (md:hidden) */}
              <div className="md:hidden divide-y divide-[var(--border)]">
                {filtered.map((doc) => (
                  <div key={doc.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[var(--foreground)] truncate">
                            {doc.doc_number}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 shrink-0">
                            {doc.type}
                          </span>
                        </div>
                        <div className="font-semibold text-xs text-[var(--foreground)] mt-1 truncate">
                          {doc.client_legal_name || "General Counterparty"}
                        </div>
                        {doc.project_name && (
                          <div className="text-[11px] text-[var(--muted-foreground)] truncate">
                            {doc.project_name}
                          </div>
                        )}
                      </div>

                      <span
                        className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          doc.status === "signed"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)] pt-1">
                      <div>
                        {doc.is_legacy ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 text-[10px]">
                            <History className="w-3 h-3" />
                            <span>Historic Book</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-[10px]">
                            <Sparkles className="w-3 h-3" />
                            <span>DocForge Generated</span>
                          </span>
                        )}
                        <span className="mx-1.5">•</span>
                        <span>
                          {new Date(doc.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {doc.pdf_path && (
                          <a
                            href={`${API_BASE_URL}${doc.pdf_path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-[var(--muted)] text-[var(--foreground)]"
                            title="Preview PDF"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {doc.docx_path && (
                          <a
                            href={`${API_BASE_URL}/documents/${doc.id}/files/docx`}
                            download
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"
                            title="Download DOCX"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-b border-[var(--border)]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Document Number</th>
                      <th className="py-2.5 px-4 font-semibold">Type</th>
                      <th className="py-2.5 px-4 font-semibold">Client & Project</th>
                      <th className="py-2.5 px-4 font-semibold">Origin</th>
                      <th className="py-2.5 px-4 font-semibold">Status</th>
                      <th className="py-2.5 px-4 font-semibold">Date</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filtered.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-[var(--foreground)]">
                          {doc.doc_number}
                        </td>

                        <td className="py-3 px-4 uppercase font-bold text-[10px] text-indigo-700 dark:text-indigo-400">
                          {doc.type}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-[var(--foreground)]">
                            {doc.client_legal_name || "General Counterparty"}
                          </div>
                          {doc.project_name && (
                            <div className="text-[11px] text-[var(--muted-foreground)]">
                              {doc.project_name}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {doc.is_legacy ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                              title={`Imported from: ${doc.legacy_source || "Existing Records Book"}`}
                            >
                              <History className="w-3 h-3" />
                              <span>Historic Book</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                              <Sparkles className="w-3 h-3" />
                              <span>Generated</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              doc.status === "signed"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            }`}
                          >
                            {doc.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-[var(--muted-foreground)]">
                          {new Date(doc.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {doc.pdf_path && (
                              <a
                                href={`${API_BASE_URL}${doc.pdf_path}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-md hover:bg-[var(--muted)] text-[var(--foreground)]"
                                title="Preview PDF"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {doc.docx_path && (
                              <a
                                href={`${API_BASE_URL}/documents/${doc.id}/files/docx`}
                                download
                                className="p-1.5 rounded-md hover:bg-[var(--muted)] text-[var(--foreground)]"
                                title="Download DOCX"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
