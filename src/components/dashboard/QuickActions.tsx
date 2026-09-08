'use client';

import { useRealtime } from '@/lib/realtime';
import { Button } from '@/components/ui/Button';
import { IconBolt, IconChart, IconGate, IconVisitor } from '@/components/ui/Icons';

export function QuickActions({ className }: { className?: string }) {
  const { raiseAlert } = useRealtime();

  return (
    <section aria-label="Quick actions" className={className}>
      <h2 className="mb-3 font-display text-sm uppercase tracking-widest text-slate-400">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button href="/visitors" variant="quickAction" size="md">
          <span className="inline-flex items-center gap-2 font-semibold uppercase tracking-wider">
            <IconVisitor /> Issue Visitor Pass
          </span>
          <span className="text-xs font-normal normal-case tracking-normal text-slate-400">
            Generate a QR pass with bay + window
          </span>
        </Button>

        <Button
          variant="quickAction"
          size="md"
          onClick={() =>
            raiseAlert(
              'info',
              'Gate override — P1 entry held open',
              'Control room raised the P1 entry arm for escorted delivery. Auto-lower in 60s.',
              'Control Room / Gate P1',
            )
          }
        >
          <span className="inline-flex items-center gap-2 font-semibold uppercase tracking-wider">
            <IconGate /> Hold Gate P1
          </span>
          <span className="text-xs font-normal normal-case tracking-normal text-slate-400">
            Escorted-vehicle entry, auto-lower 60s
          </span>
        </Button>

        <Button
          variant="quickAction"
          size="md"
          onClick={() =>
            raiseAlert(
              'warning',
              'EV load advisory broadcast',
              'Charger bank L3-F throttled to 7.2 kW per port until transformer load drops.',
              'EV Network / Transformer T2',
            )
          }
        >
          <span className="inline-flex items-center gap-2 font-semibold uppercase tracking-wider">
            <IconBolt /> Broadcast EV Advisory
          </span>
          <span className="text-xs font-normal normal-case tracking-normal text-slate-400">
            Push load-shed notice to charge ports
          </span>
        </Button>

        <Button href="/reports" variant="quickAction" size="md">
          <span className="inline-flex items-center gap-2 font-semibold uppercase tracking-wider">
            <IconChart /> Occupancy Report
          </span>
          <span className="text-xs font-normal normal-case tracking-normal text-slate-400">
            Today&apos;s peak, turnover & dwell
          </span>
        </Button>
      </div>
    </section>
  );
}
