"use client";

import React, { useEffect, useState } from "react";
import { Search, Command, Activity, Sun, Moon, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api, HealthStatus } from "@/lib/api";

export function Header() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system health
    api
      .get<HealthStatus>("/health")
      .then((res) => setHealth(res.data))
      .catch((err) => console.error("Health check error", err));

    // Dark mode state
    if (typeof window !== "undefined") {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    }
  }, []);

  const toggleTheme = () => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (root.classList.contains("dark")) {
        root.classList.remove("dark");
        setIsDark(false);
      } else {
        root.classList.add("dark");
        setIsDark(true);
      }
    }
  };

  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Global Command Palette Trigger */}
      <div className="flex items-center gap-3 w-80">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search documents, clients, invoices... (Ctrl+K)"
            className="w-full bg-[var(--muted)]/60 text-xs text-[var(--foreground)] pl-9 pr-14 py-2 rounded-lg border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-[var(--muted-foreground)]"
            readOnly
            onClick={() => alert("Global Search shortcut: Press Ctrl+K")}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] text-[var(--muted-foreground)] bg-[var(--card)] px-1.5 py-0.5 rounded border border-[var(--border)] font-mono">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right Tools: Health Indicators & Dark Mode */}
      <div className="flex items-center gap-4">
        {/* LibreOffice Status Badge */}
        {health && (
          <div
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${
              health.libreoffice_available
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
            }`}
            title={
              health.libreoffice_available
                ? `LibreOffice Headless Ready (${health.libreoffice_path || "in PATH"})`
                : "LibreOffice not detected in PATH. DOCX to PDF conversion requires LibreOffice."
            }
          >
            {health.libreoffice_available ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            <span>LibreOffice {health.libreoffice_available ? "Ready" : "Offline"}</span>
          </div>
        )}

        {/* Database Status */}
        {health && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SQLite WAL</span>
          </div>
        )}

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
          title="Toggle color theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
