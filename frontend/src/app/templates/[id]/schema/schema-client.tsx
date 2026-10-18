"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { api, Template, TemplateVersion } from "@/lib/api";
import {
  ArrowLeft,
  Save,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Lock,
  Layers,
  Code,
  Eye,
} from "lucide-react";

export default function SchemaEditorClient({ templateId }: { templateId: string }) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<TemplateVersion | null>(null);
  const [schemaFields, setSchemaFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const res = await api.get<Template>(`/templates/${templateId}`);
      setTemplate(res.data);
      if (res.data.versions && res.data.versions.length > 0) {
        const v = res.data.versions[0];
        setSelectedVersion(v);
        setSchemaFields(v.field_schema || []);
      }
    } catch (err) {
      setError("Failed to load template.");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (index: number, key: string, value: any) => {
    const updated = [...schemaFields];
    updated[index] = { ...updated[index], [key]: value };
    setSchemaFields(updated);
  };

  const handleSave = async () => {
    if (!selectedVersion) return;
    setSaving(true);
    setError("");
    setSavedSuccess(false);

    try {
      const res = await api.put(`/templates/versions/${selectedVersion.id}/schema`, {
        field_schema: schemaFields,
      });
      setSelectedVersion(res.data);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save schema.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !template) {
    return (
      <AppShell>
        <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
          Loading template schema...
        </div>
      </AppShell>
    );
  }

  const isLocked = selectedVersion?.locked_at !== null && selectedVersion?.locked_at !== undefined;

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/templates"
              className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
                  Schema Editor: {template.name}
                </h1>
                {isLocked ? (
                  <span className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span>Locked</span>
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                    Editable Draft
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Version {selectedVersion?.version_no} • {schemaFields.length} variables detected from DOCX template
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || isLocked}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-40"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Schema Saved</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save Schema"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {isLocked && (
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span>
              This version is locked because documents have already been generated using it. To change variables or form inputs, upload a new version on the Templates page.
            </span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Schema Table */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--foreground)]">Form Field Configuration</span>
            <span className="text-[11px] text-[var(--muted-foreground)] font-mono">
              Changes reflect instantly in the Document Generation Wizard
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-b border-[var(--border)]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Variable Key</th>
                  <th className="py-2.5 px-4 font-semibold">Display Label</th>
                  <th className="py-2.5 px-4 font-semibold">Field Type</th>
                  <th className="py-2.5 px-4 font-semibold">Form Section / Group</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {schemaFields.map((field, idx) => (
                  <tr key={field.key || idx} className="hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                      {field.key}
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="text"
                        disabled={isLocked}
                        value={field.label || ""}
                        onChange={(e) => handleFieldChange(idx, "label", e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-[var(--background)] border border-[var(--border)] rounded focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                      />
                    </td>

                    <td className="py-3 px-4">
                      <select
                        disabled={isLocked}
                        value={field.type || "text"}
                        onChange={(e) => handleFieldChange(idx, "type", e.target.value)}
                        className="px-2 py-1 text-xs bg-[var(--background)] border border-[var(--border)] rounded focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                      >
                        <option value="text">Single-line Text</option>
                        <option value="textarea">Multi-line Text</option>
                        <option value="date">Date Picker</option>
                        <option value="money">Currency / Money</option>
                        <option value="boolean">Checkbox / Boolean</option>
                        <option value="table">Table / Repeater</option>
                        <option value="client_ref">Client Reference</option>
                        <option value="project_ref">Project Reference</option>
                        <option value="clause_picker">Clause Picker</option>
                      </select>
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="text"
                        disabled={isLocked}
                        value={field.group || "General Information"}
                        onChange={(e) => handleFieldChange(idx, "group", e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-[var(--background)] border border-[var(--border)] rounded focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                      />
                    </td>

                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        disabled={isLocked}
                        checked={field.required !== false}
                        onChange={(e) => handleFieldChange(idx, "required", e.target.checked)}
                        className="rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500 disabled:opacity-60"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
