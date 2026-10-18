"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { api, CompanySettings } from "@/lib/api";
import { Save, Building2, Landmark, Check, AlertCircle, Upload, Smartphone } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [serverUrlSaved, setServerUrlSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
    if (typeof window !== "undefined") {
      setServerUrl(localStorage.getItem("docforge_server_url") || "http://127.0.0.1:8000");
    }
  }, []);


  const fetchSettings = async () => {
    try {
      const res = await api.get<CompanySettings>("/settings/company");
      setSettings(res.data);
    } catch (err: any) {
      setError("Failed to load organization settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError("");
    setSavedSuccess(false);

    try {
      const res = await api.put<CompanySettings>("/settings/company", settings);
      setSettings(res.data);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <AppShell>
        <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
          Loading company settings...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              Organization Settings
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Legal identity, GST particulars, and bank transfer details used across generated documents.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Saved Successfully</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Legal Identity Card */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)] text-sm font-semibold text-[var(--foreground)]">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Company Legal Entity</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Legal Entity Name
                </label>
                <input
                  type="text"
                  value={settings.legal_name || ""}
                  onChange={(e) => setSettings({ ...settings, legal_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Brand / Trade Name
                </label>
                <input
                  type="text"
                  value={settings.trade_name || ""}
                  onChange={(e) => setSettings({ ...settings, trade_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Registered Address
                </label>
                <input
                  type="text"
                  value={settings.address || ""}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={settings.state || ""}
                  onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  value={settings.gstin || ""}
                  onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] font-mono focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  PAN
                </label>
                <input
                  type="text"
                  value={settings.pan || ""}
                  onChange={(e) => setSettings({ ...settings, pan: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] font-mono focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={settings.email || ""}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Bank Transfer Details */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)] text-sm font-semibold text-[var(--foreground)]">
              <Landmark className="w-4 h-4 text-indigo-600" />
              <span>Banking & Remittance Particulars</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={settings.bank_name || ""}
                  onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={settings.bank_account_name || ""}
                  onChange={(e) => setSettings({ ...settings, bank_account_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={settings.bank_account_no || ""}
                  onChange={(e) => setSettings({ ...settings, bank_account_no: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={settings.bank_ifsc || ""}
                  onChange={(e) => setSettings({ ...settings, bank_ifsc: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  UPI ID (VPA)
                </label>
                <input
                  type="text"
                  value={settings.upi_id || ""}
                  onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Default Payment Terms (Days)
                </label>
                <input
                  type="number"
                  value={settings.default_payment_terms_days || 15}
                  onChange={(e) =>
                    setSettings({ ...settings, default_payment_terms_days: parseInt(e.target.value) || 15 })
                  }
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>

          {/* Mobile APK Server Connection */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)] text-sm font-semibold text-[var(--foreground)]">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <span>Mobile App & Backend Server Connection</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Configure the API server address that the Android APK connects to. When running on your phone over Wi-Fi, enter your computer&apos;s local IP address (e.g., <code>http://192.168.1.100:8000</code>).
            </p>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="http://127.0.0.1:8000"
                value={serverUrl}
                onChange={(e) => {
                  setServerUrl(e.target.value);
                  setServerUrlSaved(false);
                }}
                className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] font-mono focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.setItem("docforge_server_url", serverUrl.trim());
                    setServerUrlSaved(true);
                    setTimeout(() => setServerUrlSaved(false), 2500);
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all shrink-0"
              >
                {serverUrlSaved ? "Saved!" : "Set Server URL"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
