"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { api, Client } from "@/lib/api";
import {
  Users,
  Plus,
  Search,
  Building2,
  MapPin,
  Mail,
  Phone,
  Edit2,
  ChevronRight,
  UserPlus,
  Briefcase,
  X,
  Save,
  Check,
  AlertCircle,
} from "lucide-react";

interface ClientFull extends Client {
  contacts?: Array<{
    id: number;
    client_id: number;
    name: string;
    email?: string;
    phone?: string;
    role?: string;
  }>;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientFull | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form state
  const [form, setForm] = useState({
    legal_name: "",
    display_name: "",
    address: "",
    state: "West Bengal",
    state_code: "19",
    country: "India",
    gstin: "",
    pan: "",
    billing_email: "",
    signatory_name: "",
    signatory_designation: "",
    notes: "",
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get<ClientFull[]>("/clients");
      setClients(res.data);
    } catch (err) {
      console.error("Failed to load clients", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      legal_name: "",
      display_name: "",
      address: "",
      state: "West Bengal",
      state_code: "19",
      country: "India",
      gstin: "",
      pan: "",
      billing_email: "",
      signatory_name: "",
      signatory_designation: "",
      notes: "",
    });
    setError("");
    setSavedSuccess(false);
  };

  const openAddModal = () => {
    resetForm();
    setEditingClient(null);
    setShowAddModal(true);
  };

  const openEditModal = (client: ClientFull) => {
    setForm({
      legal_name: client.legal_name || "",
      display_name: client.display_name || "",
      address: client.address || "",
      state: client.state || "",
      state_code: client.state_code || "",
      country: client.country || "India",
      gstin: client.gstin || "",
      pan: client.pan || "",
      billing_email: client.billing_email || "",
      signatory_name: client.signatory_name || "",
      signatory_designation: client.signatory_designation || "",
      notes: client.notes || "",
    });
    setEditingClient(client);
    setError("");
    setSavedSuccess(false);
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.legal_name.trim()) {
      setError("Legal name is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSavedSuccess(false);

    try {
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, form);
      } else {
        await api.post("/clients", { ...form, contacts: [] });
      }
      setSavedSuccess(true);
      await fetchClients();
      setTimeout(() => {
        setShowAddModal(false);
        setSavedSuccess(false);
      }, 800);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save client.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.legal_name.toLowerCase().includes(q) ||
      (c.display_name && c.display_name.toLowerCase().includes(q)) ||
      (c.gstin && c.gstin.toLowerCase().includes(q)) ||
      (c.billing_email && c.billing_email.toLowerCase().includes(q))
    );
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              Client Directory
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Manage counterparties with GST identity, contact persons, and
              project history.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Client</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-[var(--card)] p-3 rounded-xl border border-[var(--border)] shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, GSTIN, or email..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Clients Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--muted-foreground)]">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading client directory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center shadow-sm">
            <Users className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-[var(--foreground)]">
              No clients found
            </p>
            <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
              Add your first client to start generating documents.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add First Client</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((client) => (
              <div
                key={client.id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-[var(--foreground)] truncate group-hover:text-indigo-600 transition-colors">
                        {client.display_name || client.legal_name}
                      </h3>
                      {client.display_name && (
                        <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                          {client.legal_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => openEditModal(client)}
                    className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors opacity-0 group-hover:opacity-100"
                    title="Edit client"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-[11px] text-[var(--muted-foreground)]">
                  {client.address && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">
                        {client.address}
                        {client.state ? `, ${client.state}` : ""}
                      </span>
                    </div>
                  )}
                  {client.billing_email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{client.billing_email}</span>
                    </div>
                  )}
                  {client.gstin && (
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--foreground)] font-bold">
                        GSTIN
                      </span>
                      <span>{client.gstin}</span>
                    </div>
                  )}
                </div>

                {/* Footer with signatory */}
                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <div className="text-[11px] text-[var(--muted-foreground)]">
                    {client.signatory_name ? (
                      <span>
                        Signatory:{" "}
                        <span className="font-semibold text-[var(--foreground)]">
                          {client.signatory_name}
                        </span>
                      </span>
                    ) : (
                      <span className="italic">No signatory assigned</span>
                    )}
                  </div>
                  <Link
                    href={`/projects?client_id=${client.id}`}
                    className="text-[11px] font-medium text-indigo-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>Projects</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[var(--foreground)]">
                  {editingClient ? "Edit Client" : "Add New Client"}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Legal Entity Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.legal_name}
                      onChange={(e) =>
                        setForm({ ...form, legal_name: e.target.value })
                      }
                      placeholder="e.g. Acme Technologies Pvt. Ltd."
                      className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Display / Brand Name
                    </label>
                    <input
                      type="text"
                      value={form.display_name}
                      onChange={(e) =>
                        setForm({ ...form, display_name: e.target.value })
                      }
                      placeholder="e.g. Acme Tech"
                      className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Billing Email
                    </label>
                    <input
                      type="email"
                      value={form.billing_email}
                      onChange={(e) =>
                        setForm({ ...form, billing_email: e.target.value })
                      }
                      placeholder="accounts@acme.com"
                      className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                      placeholder="Full registered address"
                      className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) =>
                        setForm({ ...form, state: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      value={form.gstin}
                      onChange={(e) =>
                        setForm({ ...form, gstin: e.target.value })
                      }
                      placeholder="22AAAAA0000A1Z5"
                      className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] font-mono focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      PAN
                    </label>
                    <input
                      type="text"
                      value={form.pan}
                      onChange={(e) =>
                        setForm({ ...form, pan: e.target.value })
                      }
                      placeholder="AAAAA0000A"
                      className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] font-mono focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Signatory Name
                    </label>
                    <input
                      type="text"
                      value={form.signatory_name}
                      onChange={(e) =>
                        setForm({ ...form, signatory_name: e.target.value })
                      }
                      placeholder="Authorized signatory"
                      className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Signatory Designation
                    </label>
                    <input
                      type="text"
                      value={form.signatory_designation}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          signatory_designation: e.target.value,
                        })
                      }
                      placeholder="e.g. CTO, Director"
                      className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Notes
                    </label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      placeholder="Internal notes about this client..."
                      className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
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
                        <span>
                          {saving
                            ? "Saving..."
                            : editingClient
                            ? "Update Client"
                            : "Add Client"}
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
