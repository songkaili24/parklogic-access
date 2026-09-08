'use client';

import * as React from 'react';

import type { VisitorPass } from '@/lib/types';
import { useRealtime } from '@/lib/realtime';
import { cn, formatDuration, formatClock, relativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { VisitorPassCard } from '@/components/ui/VisitorPassCard';
import { PassIssueForm } from '@/components/visitors/PassIssueForm';
import { BulkPassForm } from '@/components/visitors/BulkPassForm';
import { VisitHistory } from '@/components/visitors/VisitHistory';

export function VisitorManagement() {
  const { passes, visits, now } = useRealtime();

  // Print target: pass codes rendered into the print-only area.
  const [printCodes, setPrintCodes] = React.useState<string[]>([]);

  const activePasses = passes.filter((pass) => pass.validUntil > now);

  /** Render selected passes into the print-only area, then open print. */
  React.useEffect(() => {
    if (printCodes.length === 0) return;
    const timer = window.setTimeout(() => {
      window.print();
      setPrintCodes([]);
    }, 100);
    return () => window.clearTimeout(timer);
  }, [printCodes]);

  const printTargets = passes.filter((pass) => printCodes.includes(pass.code));

  return (
    <div className="space-y-4">
      {/* Print-only area for pass delivery */}
      <div className="print-pass-area" aria-hidden="true">
        {printTargets.map((pass) => (
          <VisitorPassCard key={pass.code} pass={pass} now={now} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[24rem_1fr]">
        <div className="space-y-4">
          <PassIssueForm onIssued={(code) => setPrintCodes([code])} />
          <BulkPassForm onGenerated={(codes) => setPrintCodes(codes)} />
        </div>

        <div className="space-y-4">
          <section aria-label="Active visitor passes" className="space-y-3">
            <header className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-sm uppercase tracking-widest text-slate-400">
                Active Passes ({activePasses.length})
              </h2>
              {activePasses.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPrintCodes(activePasses.map((pass) => pass.code))}
                >
                  Print All
                </Button>
              )}
            </header>

            <div className="grid gap-3 2xl:grid-cols-2">
              {passes.slice(0, 8).map((pass: VisitorPass) => {
                const expired = pass.validUntil <= now;
                const scheduled = pass.validFrom > now;
                return (
                  <div key={pass.code} className="space-y-1">
                    <VisitorPassCard
                      pass={pass}
                      now={now}
                      className={cn(scheduled && 'border-dashed border-status-charging/40')}
                    />
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] text-slate-600">
                        {scheduled
                          ? `starts ${formatClock(pass.validFrom)} · ${relativeTime(pass.validFrom, now)}`
                          : expired
                            ? 'window elapsed'
                            : `${formatDuration(Math.round((pass.validUntil - now) / 60_000))} remaining`}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrintCodes([pass.code])}
                      >
                        Print
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <VisitHistory visits={visits} now={now} />
        </div>
      </div>
    </div>
  );
}
