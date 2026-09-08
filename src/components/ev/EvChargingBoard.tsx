'use client';

import * as React from 'react';

import type { ChargingSession, ChargingStation } from '@/lib/types';
import { HOURLY_OCCUPANCY_PROFILE } from '@/lib/constants';
import { useRealtime } from '@/lib/realtime';
import { cn, formatClock, relativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconBolt } from '@/components/ui/Icons';
import { PricingPanel, StationCard } from '@/components/ev/EvStationCard';

function sessionCost(
  session: ChargingSession,
  station: ChargingStation | undefined,
  l2: number,
  dcfc: number,
): number {
  const rate = station?.chargerType === 'DC Fast Charge' ? dcfc : l2;
  return session.kwhDelivered * rate;
}

export function EvChargingBoard() {
  const { stations, sessions, tickets, pricing, resolveTicket, now } = useRealtime();

  const kwhTotal = stations.reduce((sum, station) => sum + station.kwhToday, 0);
  const revenue = stations.reduce(
    (sum, station) =>
      sum +
      station.kwhToday *
        (station.chargerType === 'DC Fast Charge' ? pricing.dcfcPerKwh : pricing.l2PerKwh) +
      station.portsInUse * pricing.sessionFee,
    0,
  );
  const openTickets = tickets.filter((ticket) => ticket.status !== 'resolved');
  const peak = HOURLY_OCCUPANCY_PROFILE.reduce((best, entry) =>
    entry.pct > best.pct ? entry : best,
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel">
          <h3 className="font-display text-xs uppercase tracking-widest text-slate-400">
            Active Sessions
          </h3>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="font-numeric font-display text-3xl font-semibold text-status-charging">
              {sessions.length}
            </span>
            <IconBolt className="animate-pulse-dot text-status-charging" />
          </p>
        </div>
        <div className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel">
          <h3 className="font-display text-xs uppercase tracking-widest text-slate-400">
            Energy Today
          </h3>
          <p className="mt-1">
            <span className="font-numeric font-display text-3xl font-semibold text-white">
              {kwhTotal.toFixed(1)}
            </span>
            <span className="text-sm text-slate-400"> kWh</span>
          </p>
        </div>
        <div className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel">
          <h3 className="font-display text-xs uppercase tracking-widest text-slate-400">
            Revenue Today
          </h3>
          <p className="mt-1">
            <span className="font-numeric font-display text-3xl font-semibold text-status-available">
              ${revenue.toFixed(0)}
            </span>
          </p>
        </div>
        <div className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel">
          <h3 className="font-display text-xs uppercase tracking-widest text-slate-400">
            Open Faults
          </h3>
          <p className="mt-1">
            <span
              className={cn(
                'font-numeric font-display text-3xl font-semibold',
                openTickets.length > 0 ? 'text-status-occupied' : 'text-slate-300',
              )}
            >
              {openTickets.length}
            </span>
          </p>
        </div>
      </div>

      <section aria-label="Charging stations" className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        {stations.map((station) => (
          <StationCard key={station.id} station={station} />
        ))}
      </section>

      <section
        aria-label="Active charging sessions"
        className="overflow-x-auto rounded border border-slate-700/70 bg-control-raised shadow-panel"
      >
        <header className="border-b border-slate-800 px-4 py-2.5">
          <h2 className="font-display text-sm uppercase tracking-widest text-slate-400">
            Active Charging Sessions
          </h2>
        </header>
        <table className="w-full min-w-[44rem] text-left text-sm">
          <caption className="sr-only">
            Charging sessions with estimated completion and cost
          </caption>
          <thead>
            <tr className="border-b border-slate-800 font-display text-xs uppercase tracking-widest text-slate-500">
              <th scope="col" className="px-4 py-2">
                Station
              </th>
              <th scope="col" className="px-4 py-2">
                User
              </th>
              <th scope="col" className="px-4 py-2">
                Plate
              </th>
              <th scope="col" className="px-4 py-2">
                Started
              </th>
              <th scope="col" className="px-4 py-2">
                Delivered
              </th>
              <th scope="col" className="px-4 py-2">
                Est. done
              </th>
              <th scope="col" className="px-4 py-2">
                Running cost
              </th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => {
              const station = stations.find((s) => s.id === session.stationId);
              return (
                <tr key={session.id} className="border-b border-slate-800/60 last:border-0">
                  <td className="px-4 py-2 font-display tracking-wider text-slate-200">
                    {session.stationId}
                  </td>
                  <td className="px-4 py-2 text-slate-100">{session.userName}</td>
                  <td className="px-4 py-2 font-display tracking-wider text-slate-300">
                    {session.plate}
                  </td>
                  <td className="font-numeric px-4 py-2 text-slate-400" suppressHydrationWarning>
                    {formatClock(session.startedAt)} · {relativeTime(session.startedAt, now)}
                  </td>
                  <td className="font-numeric px-4 py-2 text-slate-200">
                    {session.kwhDelivered}/{session.targetKwh} kWh
                  </td>
                  <td className="font-numeric px-4 py-2 text-slate-400">
                    ~{formatClock(session.startedAt + session.estMinutes * 60_000)}
                  </td>
                  <td className="font-numeric px-4 py-2 text-status-available">
                    $
                    {sessionCost(session, station, pricing.l2PerKwh, pricing.dcfcPerKwh).toFixed(2)}
                  </td>
                </tr>
              );
            })}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                  No active charging sessions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <PricingPanel />

        <section
          aria-label="Maintenance queue"
          className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel"
        >
          <h2 className="font-display text-sm uppercase tracking-widest text-slate-400">
            Maintenance Queue
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Demand peaks {peak.pct}% around {peak.hour}:00 — resolve faults before the ramp.
          </p>
          <ul className="mt-3 space-y-2">
            {tickets.map((ticket) => (
              <li
                key={ticket.id}
                className={cn(
                  'flex items-start justify-between gap-3 rounded border px-3 py-2',
                  ticket.status === 'resolved'
                    ? 'border-slate-800 opacity-50'
                    : ticket.severity === 'major'
                      ? 'border-status-occupied/40 bg-status-occupied/5'
                      : 'border-slate-800 bg-control',
                )}
              >
                <div className="min-w-0">
                  <p className="flex items-baseline gap-2 text-sm text-slate-100">
                    <span className="font-numeric text-slate-500">{ticket.id}</span>
                    {ticket.summary}
                  </p>
                  <p className="text-xs text-slate-500">
                    {ticket.stationId} ·{' '}
                    <time
                      dateTime={new Date(ticket.openedAt).toISOString()}
                      suppressHydrationWarning
                    >
                      {relativeTime(ticket.openedAt, now)}
                    </time>{' '}
                    · {ticket.status.replace('_', ' ')}
                  </p>
                </div>
                {ticket.status !== 'resolved' && (
                  <Button variant="outline" size="sm" onClick={() => resolveTicket(ticket.id)}>
                    Resolve
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
