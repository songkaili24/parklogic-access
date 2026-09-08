'use client';

import { useRealtime } from '@/lib/realtime';
import { ActivityLog } from '@/components/ui/ActivityLog';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Button } from '@/components/ui/Button';

export function LiveActivityFeed({ max = 12, className }: { max?: number; className?: string }) {
  const { activity } = useRealtime();

  return (
    <section aria-label="Recent activity" className={className}>
      <header className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm uppercase tracking-widest text-slate-400">
          Recent Activity
        </h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-status-available" />
          streaming
        </span>
      </header>
      <ActivityLog events={activity} max={max} />
    </section>
  );
}

export function AlertCenter({ className }: { className?: string }) {
  const { alerts, acknowledgeAlert } = useRealtime();

  return (
    <section id="alerts" aria-label="System alerts" className={className}>
      <header className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm uppercase tracking-widest text-slate-400">
          Alert Center
        </h2>
        <Button href="/reports" variant="outline" size="sm">
          View reports
        </Button>
      </header>
      <div className="space-y-2">
        {alerts.length === 0 && (
          <p className="rounded border border-dashed border-slate-700 p-4 text-center text-sm text-slate-500">
            No active alerts — all systems nominal.
          </p>
        )}
        {alerts.map((alert) => (
          <AlertBanner key={alert.id} alert={alert} onAcknowledge={acknowledgeAlert} />
        ))}
      </div>
    </section>
  );
}
