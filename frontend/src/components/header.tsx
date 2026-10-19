"use client";

import React, { useEffect, useState } from "react";
import {
  Menu,
  Search,
  Sun,
  Moon,
  AlertTriangle,
  CheckCircle2,
  Server,
  Wifi,
  WifiOff,
  FileText,
} from "lucide-react";
import { api, HealthStatus } from "@/lib/api";

interface HeaderProps {
  onOpenMenu?: () => void;
  onOpenServerModal?: () => void;
}

export function Header({ onOpenMenu, onOpenServerModal }: HeaderProps) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system health
    api
      .get<HealthStatus>("/health", { timeout: 3000 })
      .then((res) => {
        setHealth(res.data);
        setIsConnected(true);
      })
      .catch((err) => {
        console.warn("Backend server health check notice:", err.message);
        setIsConnected(false);
      });

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
    <header className="h-16 border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-md px-3.5 sm:px-6 flex items-center justify-between sticky top-0 z-20 pt-[env(safe-area-inset-top,0px)]">
      {/* Left: Mobile Hamburger & Brand or Desktop Search */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Drawer Toggle */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="p-2 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] lg:hidden focus:outline-none"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand Name */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-[var(--foreground)]">
            DocForge
          </span>
        </div>

        {/* Desktop Search Palette */}
        <div className="hidden lg:flex items-center gap-3 w-80">
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
      </div>

      {/* Right Tools: Server Status, Health Badges, Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Server Connection Status Pill (Mobile & Desktop) */}
        <button
          type="button"
          onClick={onOpenServerModal}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border transition-all active:scale-95 ${
            isConnected === true
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : isConnected === false
              ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
              : "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]"
          }`}
          title="Click to configure DocForge server IP address"
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isConnected === true
                ? "bg-emerald-500"
                : isConnected === false
                ? "bg-amber-500 animate-pulse"
                : "bg-slate-400"
            }`}
          />
          <span className="text-[11px] font-semibold">
            {isConnected === true ? (
              <span className="hidden sm:inline">Server Live</span>
            ) : isConnected === false ? (
              "Offline / Demo"
            ) : (
              "Connecting..."
            )}
          </span>
          <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 hidden sm:inline">
            Config
          </span>
        </button>

        {/* Desktop LibreOffice Status Badge */}
        {health && (
          <div
            className={`hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${
              health.libreoffice_available
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
            }`}
          >
            {health.libreoffice_available ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            <span>LibreOffice {health.libreoffice_available ? "Ready" : "Offline"}</span>
          </div>
        )}

        {/* Dark/Light mode toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-xl transition-colors focus:outline-none"
          title="Toggle color theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
