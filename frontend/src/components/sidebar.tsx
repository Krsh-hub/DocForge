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
  X,
  LogOut,
  Sparkles,
  Server,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const navItems = [
  { name: "Dashboard", href: "/", icon: Layers },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Invoices", href: "/invoices", icon: Receipt },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Projects", href: "/projects", icon: Briefcase },
  { name: "Templates", href: "/templates", icon: FileCheck2 },
  { name: "Clauses", href: "/clauses", icon: Sparkles },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenServerModal?: () => void;
}

export function Sidebar({ isOpen = false, onClose, onOpenServerModal }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Element */}
      <aside
        className={`w-72 sm:w-64 border-r border-[var(--border)] bg-[var(--card)] flex flex-col h-screen fixed left-0 top-0 z-50 select-none transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 sm:px-6 border-b border-[var(--border)] pt-[env(safe-area-inset-top,0px)]">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-[var(--foreground)]">
                DocForge
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">
                Local Engine
              </span>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] lg:hidden"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-3 sm:py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold shadow-xs"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] active:scale-[0.98]"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-[var(--muted-foreground)]"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Server & Connectivity Quick Link */}
        <div className="px-3 py-2 border-t border-[var(--border)] bg-[var(--card)]/50">
          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              if (onOpenServerModal) onOpenServerModal();
            }}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-[var(--muted)]/40 hover:bg-[var(--muted)] text-left text-xs transition-colors"
          >
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px] font-semibold text-[var(--foreground)]">
                Server Setup
              </span>
            </div>
            <span className="text-[10px] text-indigo-600 font-medium hover:underline">
              Configure IP
            </span>
          </button>
        </div>

        {/* User profile footer */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--card)] pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          {user ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--muted)]/50">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-xs font-semibold text-[var(--foreground)] truncate">
                  {user.name}
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)] capitalize">
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-[var(--muted-foreground)] text-center py-1 font-medium">
              DocForge Mobile & Desktop
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
