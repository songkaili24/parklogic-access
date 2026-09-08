'use client';

import * as React from 'react';

import { RealtimeProvider, useRealtime } from '@/lib/realtime';
import { TopStatusBar } from '@/components/layout/TopStatusBar';
import { Sidebar, SidebarContent } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { IconMenu } from '@/components/ui/Icons';

function UnacknowledgedAlertStrip() {
  const { alerts, acknowledgeAlert } = useRealtime();
  const active = alerts.filter((a) => !a.acknowledged && a.severity !== 'info').slice(0, 2);
  if (active.length === 0) return null;

  return (
    <div id="alerts" className="space-y-2 px-3 pt-3 sm:px-4">
      {active.map((alert) => (
        <AlertBanner key={alert.id} alert={alert} onAcknowledge={acknowledgeAlert} />
      ))}
    </div>
  );
}

function MobileMenuBar({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex items-center gap-2 px-3 pt-3 md:hidden">
      <button
        type="button"
        onClick={onOpen}
        aria-label="Open navigation menu"
        className="rounded border border-slate-700 bg-control-raised p-2 text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
      >
        <IconMenu className="text-lg" />
      </button>
      <span className="font-display text-sm uppercase tracking-widest text-slate-400">
        Operations
      </span>
    </div>
  );
}

/** Persistent chrome: status bar, sidebar, mobile nav, alert strip. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  return (
    <RealtimeProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-signal-green focus:px-3 focus:py-1.5 focus:text-control-inset"
      >
        Skip to main content
      </a>

      <TopStatusBar />

      <div className="flex min-h-[calc(100vh-3rem)]">
        <Sidebar />

        {/* Mobile drawer for primary nav */}
        {drawerOpen && (
          <div
            className="fixed inset-0 z-50 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <div
              className="absolute inset-0 bg-control-inset/80 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-64 overflow-y-auto border-r border-slate-800 bg-control">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="mb-2 rounded px-3 py-2 font-display text-xs uppercase tracking-widest text-slate-400"
              >
                Close ×
              </button>
              <SidebarContent />
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <MobileMenuBar onOpen={() => setDrawerOpen(true)} />
          <UnacknowledgedAlertStrip />
          <main id="main-content" className="px-3 pb-20 pt-3 sm:px-4 md:pb-8">
            {children}
          </main>
        </div>
      </div>

      <MobileNav />
    </RealtimeProvider>
  );
}
