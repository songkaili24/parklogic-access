'use client';

import * as React from 'react';

import type { ParkingSpot } from '@/lib/types';
import { useRealtime } from '@/lib/realtime';
import { Button } from '@/components/ui/Button';
import { IconChart, IconGate, IconLogs, IconParking, IconVisitor } from '@/components/ui/Icons';

/**
 * Modal dialog for reserving a bay: pick an open bay, optionally link an
 * existing permit holder. Driven by the realtime reserveSpot mutator.
 */
function ReserveSpaceDialog({ onClose }: { onClose: () => void }) {
  const { spots, holders, reserveSpot } = useRealtime();
  const openBays = spots.filter((spot) => spot.status === 'available');
  const [bayId, setBayId] = React.useState(openBays[0]?.id ?? '');
  const [holderId, setHolderId] = React.useState('');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Reserve a space"
    >
      <div className="absolute inset-0 bg-control-inset/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded border border-slate-700 bg-control-raised p-4 shadow-panel">
        <h2 className="font-display text-sm uppercase tracking-widest text-white">
          Reserve a Space
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Places a hold on the bay; linking a permit assigns it to the holder.
        </p>

        <form
          className="mt-3 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!bayId) return;
            reserveSpot(bayId, holderId || undefined);
            onClose();
          }}
        >
          <div>
            <label
              htmlFor="reserve-bay"
              className="mb-1 block text-xs uppercase tracking-wider text-slate-500"
            >
              Bay ({openBays.length} open)
            </label>
            <select
              id="reserve-bay"
              value={bayId}
              onChange={(e) => setBayId(e.target.value)}
              className="h-10 w-full rounded border border-slate-700 bg-control-inset px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-signal-green"
            >
              {openBays.map((spot: ParkingSpot) => (
                <option key={spot.id} value={spot.id}>
                  {spot.id} — {spot.type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="reserve-holder"
              className="mb-1 block text-xs uppercase tracking-wider text-slate-500"
            >
              Link permit holder (optional)
            </label>
            <select
              id="reserve-holder"
              value={holderId}
              onChange={(e) => setHolderId(e.target.value)}
              className="h-10 w-full rounded border border-slate-700 bg-control-inset px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-signal-green"
            >
              <option value="">Administrative hold — no permit</option>
              {holders.map((holder) => (
                <option key={holder.id} value={holder.id}>
                  {holder.name} — {holder.permitType}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={!bayId}>
              Reserve
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function QuickActions({ className }: { className?: string }) {
  const { raiseAlert } = useRealtime();
  const [reserveOpen, setReserveOpen] = React.useState(false);

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

        <Button variant="quickAction" size="md" onClick={() => setReserveOpen(true)}>
          <span className="inline-flex items-center gap-2 font-semibold uppercase tracking-wider">
            <IconParking /> Reserve Space
          </span>
          <span className="text-xs font-normal normal-case tracking-normal text-slate-400">
            Hold a bay or link a permit holder
          </span>
        </Button>

        <Button href="/logs" variant="quickAction" size="md">
          <span className="inline-flex items-center gap-2 font-semibold uppercase tracking-wider">
            <IconLogs /> View Logs
          </span>
          <span className="text-xs font-normal normal-case tracking-normal text-slate-400">
            Gate events, denials &amp; violations
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

        <Button href="/reports" variant="quickAction" size="md">
          <span className="inline-flex items-center gap-2 font-semibold uppercase tracking-wider">
            <IconChart /> Occupancy Report
          </span>
          <span className="text-xs font-normal normal-case tracking-normal text-slate-400">
            Today&apos;s peak, turnover &amp; dwell
          </span>
        </Button>
      </div>

      {reserveOpen && <ReserveSpaceDialog onClose={() => setReserveOpen(false)} />}
    </section>
  );
}
