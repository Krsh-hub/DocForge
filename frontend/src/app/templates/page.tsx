"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { api, Template, API_BASE_URL } from "@/lib/api";
import {
  FileCheck2,
  Plus,
  Upload,
  Lock,
  Calendar,
  Layers,
  ArrowRight,
  Code,
  FileText,
  AlertTriangle,
} from "lucide-react";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadType, setUploadType] = useState("sow");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const DEFAULT_FALLBACK_TEMPLATES: Template[] = [
    {
      id: 1,
      name: "Master Services Statement of Work (SOW)",
      type: "sow",
      description: "Milestone-driven professional services agreement with deliverable checkpoints and IP assignment.",
      is_active: true,
      created_at: new Date().toISOString(),
      versions: [
        {
          id: 1,
          template_id: 1,
          version_no: 1,
          file_path: "/templates/sow_v1.docx",
          locked_at: null,
          created_at: new Date().toISOString(),
          field_schema: [
            { key: "engagement_title", label: "Engagement Title", type: "string", required: true, default: "Full Stack Web Platform Engineering", group: "General" },
            { key: "effective_date", label: "Effective Date", type: "date", required: true, default: "", group: "General" },
          ],
        },
      ],
    },
    {
      id: 2,
      name: "Standard Bilateral Mutual NDA",
      type: "nda",
      description: "Two-way non-disclosure agreement for IP protection and preliminary contract negotiations.",
      is_active: true,
      created_at: new Date().toISOString(),
      versions: [
        {
          id: 2,
          template_id: 2,
          version_no: 1,
          file_path: "/templates/nda_v1.docx",
          locked_at: null,
          created_at: new Date().toISOString(),
          field_schema: [
            { key: "effective_date", label: "Effective Date", type: "date", required: true, default: "", group: "General" },
          ],
        },
      ],
    },
  ];

  const fetchTemplates = async () => {
    try {
      const res = await api.get<Template[]>("/templates");
      setTemplates(res.data);
    } catch (err) {
      console.warn("Backend unavailable, loading local offline templates:", err);
      setTemplates(DEFAULT_FALLBACK_TEMPLATES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName || !uploadFile) {
      setError("Please provide template name and select a .docx file.");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("name", uploadName);
    formData.append("type", uploadType);
    if (uploadDesc) formData.append("description", uploadDesc);
    formData.append("file", uploadFile);

    try {
      await api.post("/templates", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setShowUploadModal(false);
      setUploadName("");
      setUploadFile(null);
      await fetchTemplates();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              Document Templates
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              DOCX templates with Jinja2 placeholders, automatic variable detection, and version locking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Custom Template</span>
            </button>
          </div>
        </div>

        {/* Disclaimer Alert */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Legal Counsel Notice: </span>
            <span className="font-mono text-[11px] font-semibold bg-amber-200/60 dark:bg-amber-900/60 px-1 py-0.5 rounded">
              DRAFT TEMPLATE: REVIEW BY LEGAL COUNSEL BEFORE USE
            </span>
            <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-400">
              Pre-seeded templates are provided as starting boilerplate models. Always verify governing laws and jurisdiction before issuing to clients.
            </p>
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--muted-foreground)]">
            Loading templates...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {templates.map((tpl) => {
              const latestVer = tpl.versions?.[0];
              const varCount = latestVer?.field_schema?.length || 0;

              return (
                <div
                  key={tpl.id}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800 transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {tpl.type}
                      </span>
                      {latestVer?.locked_at ? (
                        <span
                          className="flex items-center gap-1 text-[10px] text-slate-500 font-medium"
                          title="Locked because documents have been rendered with this version"
                        >
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>v{latestVer.version_no} Locked</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-medium">
                          v{latestVer?.version_no || 1} Draft
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-[var(--foreground)] group-hover:text-indigo-600 transition-colors">
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1.5 line-clamp-2">
                      {tpl.description || "Custom business template"}
                    </p>

                    <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1 font-mono">
                        <Code className="w-3.5 h-3.5" />
                        <span>{varCount} Variables Detected</span>
                      </span>
                      <a
                        href={`${API_BASE_URL}${latestVer?.file_path}`}
                        download
                        className="text-xs text-indigo-600 hover:underline"
                        title="Download raw DOCX template"
                      >
                        Download .docx
                      </a>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 flex items-center justify-between gap-2">
                    <Link
                      href={`/templates/${tpl.id}/schema`}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-xs font-semibold text-[var(--foreground)] transition-colors"
                    >
                      Schema Editor
                    </Link>

                    <Link
                      href={`/documents/new?template_id=${tpl.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      <span>Generate</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-[var(--foreground)]">Upload New DOCX Template</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Upload any Word file (.docx). Variables like <code className="text-indigo-600 font-mono">{"{{ client.legal_name }}"}</code> will be automatically extracted.
              </p>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs border border-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="e.g. Master Services Agreement"
                    className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Template Type
                  </label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
                  >
                    <option value="sow">Statement of Work (SOW)</option>
                    <option value="nda">Non-Disclosure Agreement (NDA)</option>
                    <option value="msa">Master Services Agreement (MSA)</option>
                    <option value="invoice">Invoice</option>
                    <option value="other">Other Business Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    placeholder="Brief description of when to use this template..."
                    className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    DOCX Template File (.docx)
                  </label>
                  <input
                    type="file"
                    required
                    accept=".docx"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-[var(--foreground)] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                  >
                    {uploading ? "Analyzing & Uploading..." : "Upload & Analyze"}
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
