"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { api, Project, Client } from "@/lib/api";
import {
  Briefcase,
  Plus,
  Search,
  Calendar,
  Users,
  ArrowRight,
  X,
  Save,
  Check,
  AlertCircle,
  Clock,
  CheckCircle2,
  PauseCircle,
  Archive,
  FileText,
} from "lucide-react";

function ProjectsContent() {
  const searchParams = useSearchParams();
  const filterClientId = searchParams.get("client_id");

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    client_id: filterClientId || "",
    service_type: "tech",
    description: "",
    status: "active",
  });

  useEffect(() => {
    fetchData();
  }, [filterClientId]);

  const fetchData = async () => {
    try {
      const params: Record<string, string> = {};
      if (filterClientId) params.client_id = filterClientId;

      const [projRes, clientRes] = await Promise.all([
        api.get<Project[]>("/projects", { params }),
        api.get<Client[]>("/clients"),
      ]);
      setProjects(projRes.data);
      setClients(clientRes.data);
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.client_id) {
      setError("Project name and client are required.");
      return;
    }

    setSaving(true);
    setError("");
    setSavedSuccess(false);

    try {
      await api.post("/projects", {
        ...form,
        client_id: parseInt(form.client_id as string),
      });
      setSavedSuccess(true);
      await fetchData();
      setTimeout(() => {
        setShowAddModal(false);
        setSavedSuccess(false);
        setForm({
          name: "",
          client_id: filterClientId || "",
          service_type: "tech",
          description: "",
          status: "active",
        });
      }, 800);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create project.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      (p.client_legal_name &&
        p.client_legal_name.toLowerCase().includes(q)) ||
      p.service_type.toLowerCase().includes(q);
    const matchesStatus =
      filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusConfig: Record<
    string,
    { icon: React.ElementType; classes: string; label: string }
  > = {
    active: {
      icon: CheckCircle2,
      label: "Active",
      classes:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    },
    paused: {
      icon: PauseCircle,
      label: "Paused",
      classes:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    },
    completed: {
      icon: Archive,
      label: "Completed",
      classes:
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    },
    cancelled: {
      icon: X,
      label: "Cancelled",
      classes:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    },
  };

  const serviceTypes: Record<string, string> = {
    tech: "Technology",
    design: "Design",
    consulting: "Consulting",
    marketing: "Marketing",
    operations: "Operations",
    legal: "Legal",
    other: "Other",
  };

  // Find filtered client name
  const filterClientName =
    filterClientId
      ? clients.find((c) => c.id === parseInt(filterClientId))?.legal_name
      : null;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              Projects
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {filterClientName
                ? `Showing projects for ${filterClientName}`
                : "Manage engagement scopes, service types, and project timelines across all clients."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {filterClientId && (
              <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-all"
              >
                <X className="w-3 h-3" />
                <span>Clear filter</span>
              </Link>
            )}
            <button
              onClick={() => {
                setForm({
                  name: "",
                  client_id: filterClientId || "",
                  service_type: "tech",
                  description: "",
                  status: "active",
                });
                setError("");
                setSavedSuccess(false);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
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
              placeholder="Search by project name or client..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--muted-foreground)]">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading projects...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center shadow-sm">
            <Briefcase className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-[var(--foreground)]">
              No projects found
            </p>
            <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
              Create a project to organize documents and invoices by engagement.
            </p>
            <button
              onClick={() => {
                setForm({
                  name: "",
                  client_id: filterClientId || "",
                  service_type: "tech",
                  description: "",
                  status: "active",
                });
                setError("");
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => {
              const cfg = statusConfig[project.status] || statusConfig.active;
              const StatusIcon = cfg.icon;

              return (
                <div
                  key={project.id}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${cfg.classes}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{cfg.label}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--muted)] text-[var(--muted-foreground)]">
                        {serviceTypes[project.service_type] ||
                          project.service_type}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-[var(--foreground)] mt-2 group-hover:text-indigo-600 transition-colors">
                      {project.name}
                    </h3>

                    {project.description && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-1.5 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
                      <Users className="w-3 h-3" />
                      <span className="font-medium truncate max-w-[140px]">
                        {project.client_legal_name || "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {project.created_at
                          ? new Date(project.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Project Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[var(--foreground)]">
                  Create New Project
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
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="e.g. Mobile App Redesign"
                    className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Client *
                  </label>
                  <select
                    required
                    value={form.client_id}
                    onChange={(e) =>
                      setForm({ ...form, client_id: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select a client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.display_name || c.legal_name}
                      </option>
                    ))}
                  </select>
                  {clients.length === 0 && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      No clients found.{" "}
                      <Link href="/clients" className="underline font-medium">
                        Add a client first
                      </Link>
                      .
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Service Type
                    </label>
                    <select
                      value={form.service_type}
                      onChange={(e) =>
                        setForm({ ...form, service_type: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
                    >
                      <option value="tech">Technology</option>
                      <option value="design">Design</option>
                      <option value="consulting">Consulting</option>
                      <option value="marketing">Marketing</option>
                      <option value="operations">Operations</option>
                      <option value="legal">Legal</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Brief scope description..."
                    className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                  />
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
                        <span>Created!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>
                          {saving ? "Creating..." : "Create Project"}
                        </span>
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

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="p-12 text-center text-xs text-[var(--muted-foreground)]">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Loading projects...
        </div>
      </AppShell>
    }>
      <ProjectsContent />
    </Suspense>
  );
}
