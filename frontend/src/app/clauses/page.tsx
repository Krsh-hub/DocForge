"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { api, ClauseBlock } from "@/lib/api";
import {
  Sparkles,
  Plus,
  Search,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
  Shield,
  Scale,
  X,
  Save,
  Check,
  AlertCircle,
  Copy,
  Filter,
  Layers,
  BookOpen,
} from "lucide-react";

export default function ClausesPage() {
  const [clauses, setClauses] = useState<ClauseBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterApplies, setFilterApplies] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState({
    category: "general",
    title: "",
    body: "",
    applies_to: "sow",
    is_default: false,
  });

  useEffect(() => {
    fetchClauses();
  }, []);

  const fetchClauses = async () => {
    try {
      const res = await api.get<ClauseBlock[]>("/clauses");
      setClauses(res.data);
    } catch (err) {
      console.error("Failed to load clauses", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setError("Title and clause body are required.");
      return;
    }

    setSaving(true);
    setError("");
    setSavedSuccess(false);

    try {
      await api.post("/clauses", form);
      setSavedSuccess(true);
      await fetchClauses();
      setTimeout(() => {
        setShowAddModal(false);
        setSavedSuccess(false);
        setForm({
          category: "general",
          title: "",
          body: "",
          applies_to: "sow",
          is_default: false,
        });
      }, 800);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save clause.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this clause?")) return;

    setDeletingId(id);
    try {
      await api.delete(`/clauses/${id}`);
      await fetchClauses();
      if (expandedId === id) setExpandedId(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete clause.");
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Extract unique categories
  const categories = Array.from(new Set(clauses.map((c) => c.category))).sort();

  const filtered = clauses.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.title.toLowerCase().includes(q) ||
      c.body.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q);
    const matchesCat =
      filterCategory === "all" || c.category === filterCategory;
    const matchesApplies =
      filterApplies === "all" || c.applies_to.includes(filterApplies);
    return matchesSearch && matchesCat && matchesApplies;
  });

  // Group by category
  const grouped = filtered.reduce<Record<string, ClauseBlock[]>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {});

  const categoryIcons: Record<string, React.ElementType> = {
    confidentiality: Shield,
    termination: Scale,
    liability: Scale,
    general: FileText,
    payment: FileText,
    ip: Shield,
    default: BookOpen,
  };

  const appliesToLabels: Record<string, string> = {
    sow: "SOW",
    nda: "NDA",
    msa: "MSA",
    invoice: "Invoice",
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              Clause Library
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Reusable legal clause blocks for document generation. Select
              clauses when creating SOWs, NDAs, and contracts.
            </p>
          </div>

          <button
            onClick={() => {
              setForm({
                category: "general",
                title: "",
                body: "",
                applies_to: "sow",
                is_default: false,
              });
              setError("");
              setSavedSuccess(false);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Clause</span>
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
            <div className="text-lg font-bold text-[var(--foreground)]">
              {clauses.length}
            </div>
            <div className="text-[11px] text-[var(--muted-foreground)]">
              Total Clauses
            </div>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {categories.length}
            </div>
            <div className="text-[11px] text-[var(--muted-foreground)]">
              Categories
            </div>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {clauses.filter((c) => c.is_default).length}
            </div>
            <div className="text-[11px] text-[var(--muted-foreground)]">
              Default Clauses
            </div>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {clauses.filter((c) => c.applies_to.includes("sow")).length}
            </div>
            <div className="text-[11px] text-[var(--muted-foreground)]">
              SOW Applicable
            </div>
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
              placeholder="Search clause title or content..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={filterApplies}
              onChange={(e) => setFilterApplies(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
            >
              <option value="all">All Document Types</option>
              <option value="sow">SOW</option>
              <option value="nda">NDA</option>
              <option value="msa">MSA</option>
              <option value="invoice">Invoice</option>
            </select>
          </div>
        </div>

        {/* Clauses by Category */}
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--muted-foreground)]">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading clause library...
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center shadow-sm">
            <Sparkles className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-[var(--foreground)]">
              No clauses found
            </p>
            <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
              Build your clause library to streamline document generation.
            </p>
            <button
              onClick={() => {
                setForm({
                  category: "general",
                  title: "",
                  body: "",
                  applies_to: "sow",
                  is_default: false,
                });
                setError("");
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Clause</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, items]) => {
                const CatIcon =
                  categoryIcons[category.toLowerCase()] || categoryIcons.default;

                return (
                  <div
                    key={category}
                    className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden"
                  >
                    {/* Category Header */}
                    <div className="px-5 py-3 bg-[var(--muted)]/50 border-b border-[var(--border)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CatIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-sm font-semibold text-[var(--foreground)] capitalize">
                          {category}
                        </span>
                        <span className="text-[10px] text-[var(--muted-foreground)] bg-[var(--background)] px-1.5 py-0.5 rounded-full font-medium">
                          {items.length}
                        </span>
                      </div>
                    </div>

                    {/* Clause Items */}
                    <div className="divide-y divide-[var(--border)]">
                      {items.map((clause) => {
                        const isExpanded = expandedId === clause.id;

                        return (
                          <div key={clause.id} className="group">
                            <div
                              className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-[var(--muted)]/30 transition-colors"
                              onClick={() =>
                                setExpandedId(isExpanded ? null : clause.id)
                              }
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                                )}

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-[var(--foreground)] truncate">
                                      {clause.title}
                                    </span>
                                    {clause.is_default && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex-shrink-0">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {clause.applies_to
                                      .split(",")
                                      .map((t: string) => t.trim())
                                      .map((t: string) => (
                                        <span
                                          key={t}
                                          className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                                        >
                                          {appliesToLabels[t] || t}
                                        </span>
                                      ))}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(clause.body);
                                  }}
                                  className="p-1.5 rounded-md hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                  title="Copy clause text"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(clause.id);
                                  }}
                                  disabled={deletingId === clause.id}
                                  className="p-1.5 rounded-md hover:bg-red-50 text-[var(--muted-foreground)] hover:text-red-600 disabled:opacity-50"
                                  title="Delete clause"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="px-5 pb-4 pl-12">
                                <div className="p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] whitespace-pre-wrap leading-relaxed font-mono">
                                  {clause.body}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Add Clause Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[var(--foreground)]">
                  Add New Clause
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Clause Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="e.g. Mutual Confidentiality Obligations"
                    className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
                    >
                      <option value="general">General</option>
                      <option value="confidentiality">Confidentiality</option>
                      <option value="termination">Termination</option>
                      <option value="liability">Liability</option>
                      <option value="payment">Payment</option>
                      <option value="ip">Intellectual Property</option>
                      <option value="indemnity">Indemnity</option>
                      <option value="dispute">Dispute Resolution</option>
                      <option value="compliance">Compliance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Applies To
                    </label>
                    <select
                      value={form.applies_to}
                      onChange={(e) =>
                        setForm({ ...form, applies_to: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
                    >
                      <option value="sow">SOW</option>
                      <option value="nda">NDA</option>
                      <option value="msa">MSA</option>
                      <option value="sow,nda">SOW & NDA</option>
                      <option value="sow,nda,msa">All Contracts</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Clause Body *
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={form.body}
                    onChange={(e) =>
                      setForm({ ...form, body: e.target.value })
                    }
                    placeholder="Enter the full legal clause text..."
                    className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={form.is_default}
                    onChange={(e) =>
                      setForm({ ...form, is_default: e.target.checked })
                    }
                    className="w-3.5 h-3.5 rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="is_default"
                    className="text-xs text-[var(--foreground)]"
                  >
                    Include by default in new documents
                  </label>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-all"
                  >
                    {savedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>{saving ? "Saving..." : "Add Clause"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
