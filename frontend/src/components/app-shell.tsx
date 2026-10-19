"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { ServerConnectionModal } from "@/components/server-connection-modal";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { WifiOff, Sparkles, Smartphone, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isFirstRun, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [isServerOffline, setIsServerOffline] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    if (!isLoading && isFirstRun) {
      router.push("/onboarding");
    }

    if (typeof window !== "undefined") {
      setIsDemoMode(localStorage.getItem("docforge_use_offline_demo") === "true");
    }

    // Ping health check to determine if server is offline
    api
      .get("/health", { timeout: 2500 })
      .then(() => setIsServerOffline(false))
      .catch(() => setIsServerOffline(true));
  }, [isFirstRun, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Starting DocForge workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Responsive Sidebar (Pinned on desktop, slide-over drawer on mobile) */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenServerModal={() => setServerModalOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all duration-200">
        <Header
          onOpenMenu={() => setMobileMenuOpen(true)}
          onOpenServerModal={() => setServerModalOpen(true)}
        />

        {/* Global Disconnected / Offline Helper Banner (dismissible or tap to setup) */}
        {isServerOffline && (
          <aside
            aria-label="Offline Mode Notice"
            className="bg-amber-500/10 border-b border-amber-500/20 px-3.5 sm:px-6 py-2 text-xs flex items-center justify-between gap-3 text-amber-800 dark:text-amber-200 transition-all"
          >
            <div className="flex items-center gap-2 min-w-0">
              <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="truncate text-[11px] sm:text-xs">
                <span className="font-semibold">Local/Offline Mode Active:</span>{" "}
                <span className="hidden sm:inline">
                  Cannot connect to DocForge PC backend. Tap to configure your Wi-Fi IP address.
                </span>
                <span className="sm:hidden">Backend offline. Using local cache.</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setServerModalOpen(true)}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] shadow-xs transition-colors"
            >
              <span>Setup IP</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </aside>
        )}

        {/* Page Content with safe area bottom spacing for mobile tab bar */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Hidden on desktop) */}
      <BottomNav onOpenMenu={() => setMobileMenuOpen(true)} />

      {/* Global Server Connection & IP Setup Modal */}
      <ServerConnectionModal
        isOpen={serverModalOpen}
        onClose={() => setServerModalOpen(false)}
        onConnected={() => setIsServerOffline(false)}
      />
    </div>
  );
}
