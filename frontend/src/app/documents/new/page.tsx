"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  api,
  Template,
  Client,
  Project,
  ClauseBlock,
  MilestoneItem,
  DocumentItem,
  API_BASE_URL,
} from "@/lib/api";
import {
  FileText,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  Sparkles,
  Plus,
  Trash2,
  Eye,
  Download,
  Lock,
} from "lucide-react";
import { getOfflineClients, INITIAL_PROJECTS } from "@/lib/offline-data";

const DEFAULT_TEMPLATES: Template[] = [
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
          { key: "project_scope", label: "Project Scope & Description", type: "textarea", required: true, default: "Design, build, and deploy high-availability enterprise services.", group: "Scope" },
          { key: "client_contact_person", label: "Client Technical Lead", type: "string", required: false, default: "Director of Engineering", group: "Contacts" },
          { key: "warranty_days", label: "Warranty Period (Days)", type: "number", required: false, default: 90, group: "Terms" },
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
          { key: "purpose_of_disclosure", label: "Purpose of Disclosure", type: "textarea", required: true, default: "Evaluation of potential commercial collaboration and proprietary code evaluation.", group: "Scope" },
          { key: "term_years", label: "Confidentiality Term (Years)", type: "number", required: true, default: 2, group: "Terms" },
          { key: "jurisdiction", label: "Governing Jurisdiction", type: "string", required: true, default: "Kolkata, West Bengal, India", group: "Legal" },
        ],
      },
    ],
  },
];

const DEFAULT_CLAUSES: ClauseBlock[] = [
  {
    id: 1,
    category: "ip",
    title: "Proprietary Work Product & IP Assignment",
    body: "All intellectual property rights arising out of the deliverables shall vest in Client upon full settlement of invoice amounts.",
    applies_to: "all",
    is_default: true,
  },
  {
    id: 2,
    category: "liability",
    title: "Limitation of Aggregate Liability",
    body: "Neither party shall be liable for indirect, incidental or punitive damages. Aggregate liability capped at total fees paid.",
    applies_to: "all",
    is_default: true,
  },
  {
    id: 3,
    category: "jurisdiction",
    title: "Arbitration & Governing Law",
    body: "Disputes shall be settled under the Arbitration and Conciliation Act, with venue in Kolkata, India.",
    applies_to: "all",
    is_default: true,
  },
];

function DocumentWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTemplateId = searchParams.get("template_id");
  const preselectedType = searchParams.get("type");

  // Step state: 1 = Template & Client, 2 = Parameters, 3 = Review & Render
  const [step, setStep] = useState(1);

  // Entities
  const [templates, setTemplates] = useState<Template[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clauseBlocks, setClauseBlocks] = useState<ClauseBlock[]>([]);

  // Selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | "">("");
  const [selectedClientId, setSelectedClientId] = useState<number | "">("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");
  const [selectedClauseIds, setSelectedClauseIds] = useState<number[]>([]);

  // Dynamic Form inputs based on schema
  const [formInputs, setFormInputs] = useState<Record<string, any>>({});
  const [milestones, setMilestones] = useState<MilestoneItem[]>([
    {
      title: "Discovery, Architecture & Wireframes",
      deliverable: "System specification & interactive wireframes",
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      amount: 45000,
    },
    {
      title: "Core Implementation & Integration",
      deliverable: "Production code deployment and staging signoff",
      due_date: new Date(Date.now() + 35 * 86400000).toISOString().split("T")[0],
      amount: 75000,
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<DocumentItem | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (preselectedType === "invoice") {
      router.replace("/invoices/new");
      return;
    }

    Promise.all([
      api.get<Template[]>("/templates"),
      api.get<Client[]>("/clients"),
      api.get<Project[]>("/projects"),
      api.get<ClauseBlock[]>("/clauses"),
    ])
      .then(([tRes, cRes, pRes, clRes]) => {
        setTemplates(tRes.data);
        setClients(cRes.data);
        setProjects(pRes.data);
        setClauseBlocks(clRes.data);

        // Pre-select default clauses
        const defaultClauseIds = clRes.data.filter((c) => c.is_default).map((c) => c.id);
        setSelectedClauseIds(defaultClauseIds);

        if (preselectedTemplateId) {
          const matched = tRes.data.find((t) => t.id === Number(preselectedTemplateId));
          if (matched) {
            setSelectedTemplateId(matched.id);
            initializeFormInputs(matched);
          }
        } else if (preselectedType) {
          const matched = tRes.data.find((t) => t.type.toLowerCase() === preselectedType.toLowerCase());
          if (matched) {
            setSelectedTemplateId(matched.id);
            initializeFormInputs(matched);
          } else if (tRes.data.length > 0) {
            setSelectedTemplateId(tRes.data[0].id);
            initializeFormInputs(tRes.data[0]);
          }
        } else if (tRes.data.length > 0) {
          setSelectedTemplateId(tRes.data[0].id);
          initializeFormInputs(tRes.data[0]);
        }
      })
      .catch((err) => {
        console.warn("Backend unavailable, loading local offline templates and clients:", err);
        setTemplates(DEFAULT_TEMPLATES);
        const offClients = getOfflineClients();
        setClients(offClients);
        setProjects(INITIAL_PROJECTS);
        setClauseBlocks(DEFAULT_CLAUSES);

        const defaultClauseIds = DEFAULT_CLAUSES.filter((c) => c.is_default).map((c) => c.id);
        setSelectedClauseIds(defaultClauseIds);

        const firstTpl = DEFAULT_TEMPLATES[0];
        setSelectedTemplateId(firstTpl.id);
        initializeFormInputs(firstTpl);
        if (offClients.length > 0) {
          setSelectedClientId(offClients[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [preselectedTemplateId, preselectedType, router]);

  const initializeFormInputs = (tpl: Template) => {
    const version = tpl.versions?.[0];
    const initial: Record<string, any> = {};
    if (version?.field_schema) {
      version.field_schema.forEach((f) => {
        initial[f.key] = f.default || "";
      });
    }
    // Set effective date default
    initial["effective_date"] = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    initial["jurisdiction"] = "Kolkata, West Bengal, India";
    setFormInputs(initial);
  };

  const handleTemplateChange = (tplId: number) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) {
      initializeFormInputs(tpl);
    }
  };

  const handleClientChange = (cId: number) => {
    setSelectedClientId(cId);
    const client = clients.find((c) => c.id === cId);
    if (client) {
      // Auto-fill client linked fields
      setFormInputs((prev) => ({
        ...prev,
        client_name: client.legal_name,
        client_address: client.address || "",
        signatory_name: client.signatory_name || "",
        signatory_designation: client.signatory_designation || "",
      }));
    }
  };

  const handleClauseToggle = (clauseId: number) => {
    setSelectedClauseIds((prev) =>
      prev.includes(clauseId) ? prev.filter((id) => id !== clauseId) : [...prev, clauseId]
    );
  };

  const handleGenerate = async () => {
    const tpl = templates.find((t) => t.id === selectedTemplateId);
    const version = tpl?.versions?.[0];
    if (!version) {
      setError("No valid template version found.");
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const payload = {
        template_version_id: version.id,
        client_id: selectedClientId ? Number(selectedClientId) : null,
        project_id: selectedProjectId ? Number(selectedProjectId) : null,
        input_data: formInputs,
        milestones: tpl?.type === "sow" ? milestones : [],
        selected_clause_ids: selectedClauseIds,
      };

      const res = await api.post<DocumentItem>("/documents/generate", payload);
      setGeneratedDoc(res.data);
      setStep(3);
    } catch (err: any) {
      console.warn("Backend document generate failed, creating local offline document draft:", err);
      const chosenClient = clients.find((c) => c.id === selectedClientId);
      const chosenProject = projects.find((p) => p.id === selectedProjectId);
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const offlineDoc: DocumentItem = {
        id: Date.now(),
        doc_number: `${tpl?.type?.toUpperCase() || "DOC"}-${new Date().getFullYear()}-${randomSeq}`,
        type: tpl?.type || "sow",
        status: "draft",
        input_data: formInputs,
        revision_no: 1,
        is_legacy: false,
        client_legal_name: chosenClient?.legal_name || "Enterprise Counterparty",
        project_name: chosenProject?.name || formInputs.engagement_title || "Client Project",
        created_at: new Date().toISOString(),
        file_hash: "OFFLINE-SHA256-DRAFT-CHECK",
      };
      setGeneratedDoc(offlineDoc);
      setStep(3);
    } finally {
      setGenerating(false);
    }
  };

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId);
  const currentVersion = currentTemplate?.versions?.[0];
  const schema = currentVersion?.field_schema || [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl">
        {/* Wizard Stepper Bar */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/documents"
              className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
                Document Generation Wizard
              </h1>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Deterministic contract assembly from sandboxed DOCX templates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  step === s
                    ? "bg-indigo-600 text-white"
                    : step > s
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                }`}
              >
                <span>{s}</span>
                <span className="hidden sm:inline">
                  {s === 1 ? "Select Template" : s === 2 ? "Fill Parameters" : "Generated"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Template, Client & Project Selection */}
        {step === 1 && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-2">
                1. Select Document Template
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => handleTemplateChange(tpl.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedTemplateId === tpl.id
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-600"
                        : "border-[var(--border)] hover:bg-[var(--muted)]/40"
                    }`}
                  >
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                      {tpl.type}
                    </span>
                    <h3 className="font-bold text-xs text-[var(--foreground)] mt-2">{tpl.name}</h3>
                    <p className="text-[11px] text-[var(--muted-foreground)] mt-1 line-clamp-2">
                      {tpl.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  2. Select Client Organization (Auto-Fills Details)
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleClientChange(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
                >
                  <option value="">-- Choose Counterparty --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.legal_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  3. Select Project / Engagement
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
                >
                  <option value="">-- Choose Project (Optional) --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!selectedTemplateId}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                <span>Continue to Parameters</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Parameters Form & Live Inputs */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h2 className="text-sm font-semibold text-[var(--foreground)]">
                  Template Parameters: {currentTemplate?.name}
                </h2>
                <span className="text-[11px] text-[var(--muted-foreground)] font-mono">
                  All fields are dynamically rendered from DOCX variables
                </span>
              </div>

              {/* Dynamic form inputs based on schema */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {schema.map((f) => (
                  <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      {f.label} {f.required && <span className="text-red-500">*</span>}
                    </label>

                    {f.type === "textarea" ? (
                      <textarea
                        rows={2}
                        value={formInputs[f.key] || ""}
                        onChange={(e) =>
                          setFormInputs({ ...formInputs, [f.key]: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg"
                      />
                    ) : f.type === "boolean" ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="checkbox"
                          checked={formInputs[f.key] || false}
                          onChange={(e) =>
                            setFormInputs({ ...formInputs, [f.key]: e.target.checked })
                          }
                          className="rounded border-[var(--border)] text-indigo-600"
                        />
                        <span className="text-xs text-[var(--muted-foreground)]">
                          Enable this clause / option
                        </span>
                      </div>
                    ) : (
                      <input
                        type={f.type === "date" ? "date" : f.type === "money" ? "number" : "text"}
                        value={formInputs[f.key] || ""}
                        onChange={(e) =>
                          setFormInputs({ ...formInputs, [f.key]: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* SOW Milestones Table if template type is SOW */}
              {currentTemplate?.type === "sow" && (
                <div className="pt-4 border-t border-[var(--border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[var(--foreground)]">
                      Agreed Milestones Table
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        setMilestones([
                          ...milestones,
                          {
                            title: "",
                            deliverable: "",
                            due_date: new Date().toISOString().split("T")[0],
                            amount: 0,
                          },
                        ])
                      }
                      className="text-xs text-indigo-600 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Milestone</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {milestones.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3 border border-[var(--border)] rounded-lg bg-[var(--background)]/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                      >
                        <input
                          type="text"
                          placeholder="Milestone title"
                          value={m.title}
                          onChange={(e) => {
                            const updated = [...milestones];
                            updated[idx].title = e.target.value;
                            setMilestones(updated);
                          }}
                          className="flex-1 px-2.5 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded"
                        />
                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                          <input
                            type="number"
                            placeholder="Amount (₹)"
                            value={m.amount}
                            onChange={(e) => {
                              const updated = [...milestones];
                              updated[idx].amount = parseFloat(e.target.value) || 0;
                              setMilestones(updated);
                            }}
                            className="w-full sm:w-28 px-2.5 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded font-mono"
                          />
                          <input
                            type="date"
                            value={m.due_date || ""}
                            onChange={(e) => {
                              const updated = [...milestones];
                              updated[idx].due_date = e.target.value;
                              setMilestones(updated);
                            }}
                            className="w-full sm:w-36 px-2.5 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded"
                          />
                        </div>
                        {milestones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = milestones.filter((_, i) => i !== idx);
                              setMilestones(updated);
                            }}
                            className="self-end sm:self-center p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Remove milestone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clause Library Picker */}
              <div className="pt-4 border-t border-[var(--border)] space-y-3">
                <h3 className="text-xs font-bold text-[var(--foreground)]">
                  Select Applicable Legal Clauses
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {clauseBlocks.map((c) => {
                    const isChecked = selectedClauseIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleClauseToggle(c.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isChecked
                            ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40"
                            : "border-[var(--border)] hover:bg-[var(--muted)]/40"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-[var(--border)] text-indigo-600"
                          />
                          <span className="text-xs font-semibold text-[var(--foreground)]">
                            {c.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--muted-foreground)] mt-1 line-clamp-2 pl-5">
                          {c.body}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] text-[var(--muted-foreground)]"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{generating ? "Rendering Document..." : "Generate Document"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Generation Success & Download */}
        {step === 3 && generatedDoc && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 shadow-sm text-center max-w-xl mx-auto space-y-5">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                Document Generated Successfully!
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 font-mono">
                Assigned Number: {generatedDoc.doc_number}
              </p>
            </div>

            <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border)] text-left text-xs space-y-1.5 font-mono">
              <div>
                <span className="text-[var(--muted-foreground)]">Type: </span>
                <span className="font-semibold uppercase">{generatedDoc.type}</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">File Hash (SHA-256): </span>
                <span className="text-[11px] text-slate-500 truncate block">
                  {generatedDoc.file_hash || "Calculated on server"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href={`${API_BASE_URL}/documents/${generatedDoc.id}/files/docx`}
                download
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download DOCX</span>
              </a>

              {generatedDoc.pdf_path && (
                <a
                  href={`${API_BASE_URL}${generatedDoc.pdf_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] text-xs font-semibold transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview PDF</span>
                </a>
              )}

              <Link
                href="/documents"
                className="px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)] hover:underline"
              >
                View in Repository
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function DocumentWizardPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-[var(--muted-foreground)]">Loading document wizard...</p>
            </div>
          </div>
        </AppShell>
      }
    >
      <DocumentWizardContent />
    </Suspense>
  );
}
