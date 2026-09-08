'use client';

import * as React from 'react';

import type { GateEvent, GateId, GateResult, GateEventType } from '@/lib/types';
import { GATES } from '@/lib/constants';
import { downloadCsv } from '@/lib/csv';
import { useRealtime } from '@/lib/realtime';
import { cn, formatClock } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const EVENT_FILTERS: Array<GateEventType | 'all'> = [
  'all',
  'entry',
  'exit',
  'denied',
  'gate_hold',
  'manual_override',
];
const RESULT_FILTERS: Array<GateResult | 'all'> = ['all', 'granted', 'denied', 'warning'];

const EVENT_LABELS: Record<GateEventType, string> = {
  entry: 'Entry',
  exit: 'Exit',
  denied: 'Denied',
  gate_hold: 'Gate Hold',
  manual_override: 'Manual Override',
};

const VIOLATION_LABELS: Record<NonNullable<GateEvent['violation']>, string> = {
  unauthorized: 'Unauthorized',
  expired_permit: 'Expired Permit',
  tailgating: 'Tailgating',
  blacklisted: 'Blacklisted',
};

function eventTone(event: GateEvent): 'success' | 'critical' | 'warning' | 'info' {
  if (event.violation || event.result === 'denied') return 'critical';
  if (event.result === 'warning') return 'warning';
  if (event.eventType === 'gate_hold' || event.eventType === 'manual_override') return 'info';
  return 'success';
}

export function AccessLogExplorer() {
  const { gateEvents, toggleGateEventFlag } = useRealtime();

  const [eventFilter, setEventFilter] = React.useState<GateEventType | 'all'>('all');
  const [gateFilter, setGateFilter] = React.useState<GateId | 'all'>('all');
  const [resultFilter, setResultFilter] = React.useState<GateResult | 'all'>('all');
  const [query, setQuery] = React.useState('');
  const [violationOnly, setViolationOnly] = React.useState(false);
  const [exportFrom, setExportFrom] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [exportTo, setExportTo] = React.useState(() => new Date().toISOString().slice(0, 10));

  const filtered = gateEvents.filter((event) => {
    if (eventFilter !== 'all' && event.eventType !== eventFilter) return false;
    if (gateFilter !== 'all' && event.gate !== gateFilter) return false;
    if (resultFilter !== 'all' && event.result !== resultFilter) return false;
    if (violationOnly && !event.violation) return false;
    const q = query.trim().toLowerCase();
    if (q.length > 0 && !event.plate.toLowerCase().includes(q.replace(/[-\s]/g, ''))) return false;
    return true;
  });

  const violations = filtered.filter((event) => event.violation).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="log-event-filter" className="sr-only">
          Filter by event type
        </label>
        <select
          id="log-event-filter"
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value as GateEventType | 'all')}
          className="h-9 rounded border border-slate-700 bg-control-inset px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-signal-green"
        >
          {EVENT_FILTERS.map((value) => (
            <option key={value} value={value}>
              {value === 'all' ? 'All events' : EVENT_LABELS[value]}
            </option>
          ))}
        </select>

        <label htmlFor="log-gate-filter" className="sr-only">
          Filter by gate
        </label>
        <select
          id="log-gate-filter"
          value={gateFilter}
          onChange={(e) => setGateFilter(e.target.value as GateId | 'all')}
          className="h-9 rounded border border-slate-700 bg-control-inset px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-signal-green"
        >
          <option value="all">All gates</option>
          {GATES.map((gate) => (
            <option key={gate} value={gate}>
              {gate}
            </option>
          ))}
        </select>

        <label htmlFor="log-result-filter" className="sr-only">
          Filter by result
        </label>
        <select
          id="log-result-filter"
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value as GateResult | 'all')}
          className="h-9 rounded border border-slate-700 bg-control-inset px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-signal-green"
        >
          {RESULT_FILTERS.map((value) => (
            <option key={value} value={value}>
              {value === 'all' ? 'All results' : value}
            </option>
          ))}
        </select>

        <label htmlFor="log-plate-search" className="sr-only">
          Search by license plate
        </label>
        <input
          id="log-plate-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search plate…"
          className="h-9 w-40 rounded border border-slate-700 bg-control-inset px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-signal-green"
        />

        <label
          htmlFor="log-violations"
          className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-400"
        >
          <input
            id="log-violations"
            type="checkbox"
            checked={violationOnly}
            onChange={(e) => setViolationOnly(e.target.checked)}
            className="accent-status-occupied"
          />
          Violations only
        </label>

        <span className="ml-auto text-xs text-slate-500">
          {filtered.length} event{filtered.length === 1 ? '' : 's'} · {violations} violation
          {violations === 1 ? '' : 's'} · live tail
        </span>
      </div>

      <div className="overflow-x-auto rounded border border-slate-700/70 bg-control-raised shadow-panel">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <caption className="sr-only">Chronological gate event log</caption>
          <thead>
            <tr className="border-b border-slate-800 font-display text-xs uppercase tracking-widest text-slate-500">
              <th scope="col" className="px-4 py-2.5">
                Timestamp
              </th>
              <th scope="col" className="px-4 py-2.5">
                Event
              </th>
              <th scope="col" className="px-4 py-2.5">
                Plate
              </th>
              <th scope="col" className="px-4 py-2.5">
                Gate
              </th>
              <th scope="col" className="px-4 py-2.5">
                Result
              </th>
              <th scope="col" className="px-4 py-2.5">
                Detail
              </th>
              <th scope="col" className="px-4 py-2.5">
                Flag
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 60).map((event) => (
              <tr
                key={event.id}
                className={cn(
                  'border-b border-slate-800/60 last:border-0',
                  (event.violation || event.flagged) && 'bg-status-occupied/5',
                )}
              >
                <td className="font-numeric px-4 py-2 text-slate-400">
                  <time dateTime={new Date(event.timestamp).toISOString()} suppressHydrationWarning>
                    {formatClock(event.timestamp)}
                  </time>
                </td>
                <td className="px-4 py-2">
                  <Badge tone={eventTone(event)} size="sm">
                    {EVENT_LABELS[event.eventType]}
                  </Badge>
                </td>
                <td className="px-4 py-2 font-display tracking-wider text-slate-200">
                  {event.plate}
                </td>
                <td className="px-4 py-2 text-slate-400">{event.gate}</td>
                <td className="px-4 py-2">
                  {event.violation ? (
                    <Badge tone="critical" size="sm" dot>
                      {VIOLATION_LABELS[event.violation]}
                    </Badge>
                  ) : (
                    <span
                      className={cn(
                        'text-xs',
                        event.result === 'granted'
                          ? 'text-status-available'
                          : 'text-status-reserved',
                      )}
                    >
                      {event.result}
                    </span>
                  )}
                </td>
                <td
                  className="max-w-[16rem] truncate px-4 py-2 text-xs text-slate-500"
                  title={event.detail}
                >
                  {event.detail ?? '—'}
                </td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    aria-pressed={event.flagged ?? false}
                    aria-label={
                      event.flagged ? `Unflag event at ${event.gate}` : `Flag event for review`
                    }
                    onClick={() => toggleGateEventFlag(event.id)}
                    className={cn(
                      'rounded border px-2 py-0.5 font-display text-[10px] uppercase tracking-widest transition-colors',
                      event.flagged
                        ? 'border-status-occupied/60 bg-status-occupied/15 text-status-occupied'
                        : 'border-slate-700 text-slate-500 hover:border-status-occupied/50 hover:text-status-occupied',
                    )}
                  >
                    {event.flagged ? 'Flagged' : 'Flag'}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  No gate events match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


    </div>
  );
}
