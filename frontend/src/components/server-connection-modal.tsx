"use client";

import React, { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  Server,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Sparkles,
  Smartphone,
  Laptop,
  HelpCircle,
} from "lucide-react";
import axios from "axios";

interface ServerConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: (url: string) => void;
}

export function ServerConnectionModal({
  isOpen,
  onClose,
  onConnected,
}: ServerConnectionModalProps) {
  const [currentUrl, setCurrentUrl] = useState("http://127.0.0.1:8000");
  const [inputUrl, setInputUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("docforge_server_url") || "http://127.0.0.1:8000";
      setCurrentUrl(saved);
      setInputUrl(saved);
      setIsDemoMode(localStorage.getItem("docforge_use_offline_demo") === "true");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const testConnection = async (targetUrl: string) => {
    const cleanUrl = targetUrl.trim().replace(/\/+$/, "");
    if (!cleanUrl) return;

    setTesting(true);
    setTestResult(null);

    try {
      const res = await axios.get(`${cleanUrl}/health`, { timeout: 3500 });
      if (res.status === 200) {
        setTestResult({
          success: true,
          message: `Connected successfully! Engine v${res.data?.version || "1.0"}`,
        });
      } else {
        setTestResult({
          success: false,
          message: `Server replied with status ${res.status}. Expected 200.`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message:
          err.code === "ECONNABORTED"
            ? "Connection timed out. Check if your PC is on the same Wi-Fi."
            : `Cannot connect to ${cleanUrl}. Check IP address and backend port 8000.`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const cleanUrl = inputUrl.trim().replace(/\/+$/, "");
    if (typeof window !== "undefined") {
      localStorage.setItem("docforge_server_url", cleanUrl);
      localStorage.setItem("docforge_use_offline_demo", "false");
    }
    setCurrentUrl(cleanUrl);
    if (onConnected) onConnected(cleanUrl);
    onClose();
    window.location.reload();
  };

  const handleToggleDemoMode = () => {
    if (typeof window !== "undefined") {
      const nextState = !isDemoMode;
      localStorage.setItem("docforge_use_offline_demo", String(nextState));
      setIsDemoMode(nextState);
      onClose();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--foreground)]">
                Backend Connection Setup
              </h2>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Configure Mobile App API Endpoint
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Wi-Fi Explanation Banner */}
        <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 dark:bg-indigo-950/40 dark:border-indigo-900/60 text-xs space-y-1.5 text-indigo-950 dark:text-indigo-200">
          <div className="flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-300">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Using DocForge on a Mobile Phone?</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--foreground)]/80">
            Phones cannot connect to <code>127.0.0.1</code> (which points to the phone itself). Connect your phone to the <strong>same Wi-Fi network as your PC</strong>, then enter your PC&apos;s Wi-Fi IP (e.g. <code>http://192.168.1.15:8000</code>).
          </p>
        </div>

        {/* Server URL Input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[var(--foreground)]">
            Server API URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setTestResult(null);
              }}
              placeholder="e.g. http://192.168.1.15:8000"
              className="flex-1 text-xs px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => testConnection(inputUrl)}
              disabled={testing || !inputUrl.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-[var(--muted)] hover:bg-[var(--muted)]/80 border border-[var(--border)] text-xs font-semibold rounded-lg text-[var(--foreground)] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Test</span>
            </button>
          </div>

          {/* Test Status Feedback */}
          {testResult && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                testResult.success
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span className="text-[11px] font-medium leading-snug">
                {testResult.message}
              </span>
            </div>
          )}
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] tracking-wider">
            Quick Host Presets
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setInputUrl("http://10.0.2.2:8000");
                testConnection("http://10.0.2.2:8000");
              }}
              className="p-2 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:border-indigo-500 text-left transition-all"
            >
              <span className="block font-semibold text-[11px] text-[var(--foreground)]">
                Android Emulator
              </span>
              <span className="block text-[10px] text-[var(--muted-foreground)] font-mono">
                http://10.0.2.2:8000
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setInputUrl("http://127.0.0.1:8000");
                testConnection("http://127.0.0.1:8000");
              }}
              className="p-2 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:border-indigo-500 text-left transition-all"
            >
              <span className="block font-semibold text-[11px] text-[var(--foreground)]">
                PC Browser Local
              </span>
              <span className="block text-[10px] text-[var(--muted-foreground)] font-mono">
                http://127.0.0.1:8000
              </span>
            </button>
          </div>
        </div>

        {/* Demo Mode Fallback Option */}
        <div className="pt-2 border-t border-[var(--border)]">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--muted)]/50 border border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-[var(--foreground)]">
                  Standalone Demo Mode
                </span>
                <span className="block text-[10px] text-[var(--muted-foreground)]">
                  Use built-in sample data without connecting to a PC
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleDemoMode}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isDemoMode
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                  : "bg-[var(--card)] hover:bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)]"
              }`}
            >
              {isDemoMode ? "Active" : "Enable"}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-sm transition-all"
          >
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
}
