"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { api, CompanySettings } from "@/lib/api";
import {
  Save,
  Building2,
  Landmark,
  Check,
  AlertCircle,
  Smartphone,
  RefreshCw,
  Sparkles,
  Server,
  Wifi,
  CheckCircle2,
} from "lucide-react";
import {
  getOfflineSettings,
  saveOfflineSettings,
} from "@/lib/offline-data";
import axios from "axios";

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>(getOfflineSettings());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState("");

  // Server URL & connectivity state
  const [serverUrl, setServerUrl] = useState("http://127.0.0.1:8000");
  const [serverUrlSaved, setServerUrlSaved] = useState(false);
  const [testingServer, setTestingServer] = useState(false);
  const [serverTestMsg, setServerTestMsg] = useState<{
    success: boolean;
    text: string;
  } | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    fetchSettings();
    if (typeof window !== "undefined") {
      const savedUrl = localStorage.getItem("docforge_server_url") || "http://127.0.0.1:8000";
      setServerUrl(savedUrl);
      setIsDemoMode(localStorage.getItem("docforge_use_offline_demo") === "true");
    }
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get<CompanySettings>("/settings/company", { timeout: 3000 });
      setSettings(res.data);
      saveOfflineSettings(res.data);
    } catch (err: any) {
      console.warn("Using offline cached settings:", err.message);
      setSettings(getOfflineSettings());
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    const cleanUrl = serverUrl.trim().replace(/\/+$/, "");
    if (!cleanUrl) return;
    setTestingServer(true);
    setServerTestMsg(null);
    try {
      const res = await axios.get(`${cleanUrl}/health`, { timeout: 3500 });
      if (res.status === 200) {
        setServerTestMsg({
          success: true,
          text: `Connected successfully! Engine v${res.data?.version || "1.0"}`,
        });
      } else {
        setServerTestMsg({
          success: false,
          text: `Server responded with status ${res.status}`,
        });
      }
    } catch (err: any) {
      setServerTestMsg({
        success: false,
        text: `Cannot reach ${cleanUrl}. Check IP address and ensure PC backend is running.`,
      });
    } finally {
      setTestingServer(false);
    }
  };

  const handleSaveServerUrl = () => {
    const cleanUrl = serverUrl.trim().replace(/\/+$/, "");
    if (typeof window !== "undefined") {
      localStorage.setItem("docforge_server_url", cleanUrl);
      localStorage.setItem("docforge_use_offline_demo", "false");
      setServerUrlSaved(true);
      setTimeout(() => setServerUrlSaved(false), 2500);
    }
  };

  const handleToggleDemoMode = () => {
    if (typeof window !== "undefined") {
      const nextState = !isDemoMode;
      localStorage.setItem("docforge_use_offline_demo", String(nextState));
      setIsDemoMode(nextState);
      window.location.reload();
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSavedSuccess(false);

    try {
      const res = await api.put<CompanySettings>("/settings/company", settings, { timeout: 3500 });
      setSettings(res.data);
      saveOfflineSettings(res.data);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.warn("Backend unavailable, saving settings offline:", err.message);
      saveOfflineSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              Organization Settings
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Legal identity, GST particulars, bank remittance, and mobile server network settings.
            </p>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50"
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
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Mobile & Backend Server Connection Card (Top Priority for Mobile Users) */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <span>Mobile App & Backend Server Connection</span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Network Settings
            </span>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 dark:bg-indigo-950/40 dark:border-indigo-900/60 text-xs text-[var(--foreground)]/90 space-y-1">
            <p className="font-semibold text-indigo-900 dark:text-indigo-300">
              Connecting from an Android device or Mobile APK:
            </p>
            <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
              When running on your mobile phone, enter your PC&apos;s local Wi-Fi IP address (e.g. <code>http://192.168.1.15:8000</code>). Make sure your PC and phone are on the same Wi-Fi network and FastAPI is running on port 8000.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[var(--foreground)]">
              Server API URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="http://192.168.1.15:8000"
                value={serverUrl}
                onChange={(e) => {
                  setServerUrl(e.target.value);
                  setServerTestMsg(null);
                  setServerUrlSaved(false);
                }}
                className="flex-1 px-3 py-2.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingServer || !serverUrl.trim()}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-[var(--muted)] hover:bg-[var(--muted)]/80 border border-[var(--border)] text-[var(--foreground)] rounded-xl text-xs font-semibold transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingServer ? "animate-spin" : ""}`} />
                  <span>Test Ping</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveServerUrl}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
                >
                  {serverUrlSaved ? "Saved!" : "Save IP"}
                </button>
              </div>
            </div>

            {/* Test feedback message */}
            {serverTestMsg && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                  serverTestMsg.success
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900"
                }`}
              >
                {serverTestMsg.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span className="text-[11px] font-medium">{serverTestMsg.text}</span>
              </div>
            )}
          </div>

          {/* Quick presets & Demo mode */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] tracking-wider">
                Presets:
              </span>
              <button
                type="button"
                onClick={() => {
                  setServerUrl("http://10.0.2.2:8000");
                  setServerTestMsg(null);
                }}
                className="text-[11px] px-2 py-1 rounded-lg bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] font-mono"
              >
                Emulator (10.0.2.2)
              </button>
              <button
                type="button"
                onClick={() => {
                  setServerUrl("http://127.0.0.1:8000");
                  setServerTestMsg(null);
                }}
                className="text-[11px] px-2 py-1 rounded-lg bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] font-mono"
              >
                Localhost (127.0.0.1)
              </button>
            </div>

            <button
              type="button"
              onClick={handleToggleDemoMode}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isDemoMode
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                  : "bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] border border-[var(--border)]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isDemoMode ? "Demo Mode Active" : "Use Offline Demo Data"}</span>
            </button>
          </div>
        </div>

        {/* 2. Company & Bank Settings Form */}
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Legal Identity Card */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)] text-sm font-semibold text-[var(--foreground)]">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Company Legal Entity</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Legal Entity Name
                </label>
                <input
                  type="text"
                  value={settings.legal_name || ""}
                  onChange={(e) => setSettings({ ...settings, legal_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Trade / Brand Name
                </label>
                <input
                  type="text"
                  value={settings.trade_name || ""}
                  onChange={(e) => setSettings({ ...settings, trade_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
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
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] font-mono uppercase focus:ring-1 focus:ring-indigo-500"
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
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] font-mono uppercase focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Registered Address
                </label>
                <input
                  type="text"
                  value={settings.address || ""}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
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
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Default Tax Rate (%)
                </label>
                <input
                  type="number"
                  value={settings.default_tax_rate ?? 18}
                  onChange={(e) =>
                    setSettings({ ...settings, default_tax_rate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Bank & Remittance Particulars */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)] text-sm font-semibold text-[var(--foreground)]">
              <Landmark className="w-4 h-4 text-indigo-600" />
              <span>Bank & Remittance Particulars</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={settings.bank_name || ""}
                  onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={settings.bank_account_no || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, bank_account_no: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] font-mono focus:ring-1 focus:ring-indigo-500"
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
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] font-mono uppercase focus:ring-1 focus:ring-indigo-500"
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
                  placeholder="name@okhdfcbank"
                  className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Invoice Terms & Footer */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <label className="block text-xs font-semibold text-[var(--foreground)]">
              Default Invoice Footer & Payment Instructions
            </label>
            <textarea
              rows={3}
              value={settings.invoice_footer || ""}
              onChange={(e) => setSettings({ ...settings, invoice_footer: e.target.value })}
              className="w-full text-xs p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </form>
      </div>
    </AppShell>
  );
}
