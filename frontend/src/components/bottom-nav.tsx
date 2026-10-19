"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  FileText,
  Receipt,
  Users,
  Menu,
} from "lucide-react";

interface BottomNavProps {
  onOpenMenu: () => void;
}

export function BottomNav({ onOpenMenu }: BottomNavProps) {
  const pathname = usePathname();

  const navTabs = [
    { name: "Dashboard", href: "/", icon: Layers },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "Invoices", href: "/invoices", icon: Receipt },
    { name: "Clients", href: "/clients", icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-[var(--card)]/95 backdrop-blur-md border-t border-[var(--border)] px-2 pt-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-lg select-none">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navTabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/" && pathname.startsWith(tab.href));
          const Icon = tab.icon;

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-all ${
                  isActive ? "bg-indigo-50 dark:bg-indigo-950/70" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">
                {tab.name}
              </span>
            </Link>
          );
        })}

        {/* More / Menu Drawer Toggle */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"
        >
          <div className="p-1 rounded-lg">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Menu</span>
        </button>
      </div>
    </nav>
  );
}
