"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { api, Client, MilestoneItem } from "@/lib/api";
import {
  History,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  FileText,
  Upload,
} from "lucide-react";

export default function ImportExistingOrderPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [docType, setDocType] = useState("sow");
  const [customDocNumber, setCustomDocNumber] = useState("");
  const [clientId, setClientId] = useState<number | "">("");
  const [projectName, setProjectName] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState("signed");
  const [totalAmount, setTotalAmount] = useState(0);
  const [currency, setCurrency] = useState("INR");
  const [legacySource, setLegacySource] = useState("Physical Books / Historical Register");
  const [notes, setNotes] = useState("");
  const [signedFile, setSignedFile] = useState<File | null>(null);

  // Milestones
  const [milestones, setMilestones] = useState<MilestoneItem[]>([
    {
      title: "Initial Deliverable Milestone",
      deliverable: "Deliverable specification & initial kickoff",
      due_date: new Date().toISOString().split("T")[0],
      amount: 0,
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Client[]>("/clients")
      .then((res) => setClients(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const addMilestone = () => {
    setMilestones([
      ...milestones,
      { title: "", deliverable: "", due_date: effectiveDate, amount: 0 },
    ]);
  };

  const removeMilestone = (idx: number) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const updateMilestone = (idx: number, key: keyof MilestoneItem, val: any) => {
    const updated = [...milestones];
    updated[idx] = { ...updated[idx], [key]: val };
    setMilestones(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDocNumber.trim()) {
      setError("Please specify the historical order / document reference number.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        type: docType,
        custom_doc_number: customDocNumber.trim(),
        client_id: clientId ? Number(clientId) : null,
        project_name: projectName.trim() || null,
        effective_date: effectiveDate,
        status: status,
        total_amount: Number(totalAmount) || 0,
        currency: currency,
        legacy_source: legacySource,
        notes: notes,
        milestones: milestones.filter((m) => m.title.trim()),
      };

      const res = await api.post("/documents/import-legacy-order", payload);
      const newDoc = res.data;

      // If signed file was uploaded, attach it
      if (signedFile && newDoc.id) {
        const formData = new FormData();
        formData.append("file", signedFile);
        await api.post(`/documents/${newDoc.id}/upload-signed-copy`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      router.push("/documents");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to record existing order.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Link
            href="/documents"
            className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)] flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              <span>Record Existing / Historic Order</span>
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Enter past contracts from physical books or old records to enable milestone tracking, addendums, and invoices.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Historic Reference & Client */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
              1. Historical Order Particulars
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Existing Contract / Document Reference *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SOW-2025-042 or AKS/OLD/88"
                  value={customDocNumber}
                  onChange={(e) => setCustomDocNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg font-mono font-bold text-indigo-700 dark:text-indigo-400 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Contract Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
                >
                  <option value="sow">Statement of Work (SOW)</option>
                  <option value="nda">Non-Disclosure Agreement (NDA)</option>
                  <option value="msa">Master Services Agreement (MSA)</option>
                  <option value="invoice">Invoice / Bill</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Client Organization
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.legal_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Project / Engagement Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Marketing Retainer & Lead Gen"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Historical Effective / Execution Date
                </label>
                <input
                  type="date"
                  required
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Historical Source / Register Book
                </label>
                <input
                  type="text"
                  value={legacySource}
                  onChange={(e) => setLegacySource(e.target.value)}
                  placeholder="e.g. Physical 2025 Ledger or Old CRM"
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Total Agreed Contract Value (INR)
                </label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Current Execution Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
                >
                  <option value="signed">Signed & Executed</option>
                  <option value="sent">Sent to Client</option>
                  <option value="archived">Archived / Completed</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Upload Scanned / Signed Document File (Optional PDF/DOCX)
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => setSignedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[var(--foreground)] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Milestones Breakdown */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                2. Agreed Milestones & Deliverable Schedule
              </h2>
              <button
                type="button"
                onClick={addMilestone}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Milestone</span>
              </button>
            </div>

            <div className="space-y-3">
              {milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-[var(--border)] rounded-lg bg-[var(--background)]/50 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-600">
                      Milestone {idx + 1}
                    </span>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Milestone Title (e.g. Phase 1 Acceptance)"
                        value={m.title}
                        onChange={(e) => updateMilestone(idx, "title", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Amount (INR)"
                        value={m.amount}
                        onChange={(e) =>
                          updateMilestone(idx, "amount", parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Deliverable Description"
                        value={m.deliverable || ""}
                        onChange={(e) => updateMilestone(idx, "deliverable", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded"
                      />
                    </div>
                    <div>
                      <input
                        type="date"
                        value={m.due_date || ""}
                        onChange={(e) => updateMilestone(idx, "due_date", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Notes & Action */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Internal Remarks / Reference Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special contract terms, payment references, or physical folder location..."
                className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/documents"
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? "Saving to Books..." : "Save Historical Order"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
