"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  FileCheck2,
  Users,
  Briefcase,
  Layers,
  Receipt,
  Settings,
  ShieldAlert,
  ChevronRight,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { name: "Dashboard", href: "/", icon: Layers },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Invoices", href: "/invoices", icon: Receipt },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Projects", href: "/projects", icon: Briefcase },
  { name: "Templates", href: "/templates", icon: FileCheck2 },
  { name: "Clauses", href: "/clauses", icon: Sparkles },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 border-r border-[var(--border)] bg-[var(--card)] flex flex-col h-screen fixed left-0 top-0 z-30 transition-all select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--border)] gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-200">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base tracking-tight text-[var(--foreground)]">DocForge</span>
          <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">Local Engine</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-[var(--muted-foreground)]"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile footer */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--card)]">
        {user ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--muted)]/50">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-semibold text-[var(--foreground)] truncate">{user.name}</span>
              <span className="text-[11px] text-[var(--muted-foreground)] capitalize">{user.role}</span>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-[var(--muted-foreground)] text-center py-2">
            Local User Session
          </div>
        )}
      </div>
    </aside>
  );
}
