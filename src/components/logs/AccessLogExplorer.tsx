'use client';

import * as React from 'react';

import type { ActivityKind } from '@/lib/types';
import { useRealtime } from '@/lib/realtime';
import { ActivityLog } from '@/components/ui/ActivityLog';

const KIND_FILTERS: Array<{ value: ActivityKind | 'all'; label: string }> = [
  { value: 'all', label: 'All Events' },
  { value: 'entry', label: 'Entries' },
  { value: 'exit', label: 'Exits' },
  { value: 'pass_issued', label: 'Passes' },
  { value: 'gate_hold', label: 'Gate Holds' },
  { value: 'charge_started', label: 'Charging' },
];

export function AccessLogExplorer() {
  const { activity } = useRealtime();
  const [filter, setFilter] = React.useState<(typeof KIND_FILTERS)[number]['value']>('all');
  const [query, setQuery] = React.useState('');

  const filtered = activity.filter((event) => {
    const matchesFilter =
      filter === 'all' ||
      event.kind === filter ||
      (filter === 'charge_started' && event.kind === 'charge_complete');
    const q = query.trim().toLowerCase();
    const matchesQuery =
      q.length === 0 ||
      event.message.toLowerCase().includes(q) ||
      (event.actor ?? '').toLowerCase().includes(q) ||
      (event.spot ?? '').toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="log-filter" className="sr-only">
          Filter log by event type
        </label>
        <select
          id="log-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value as (typeof KIND_FILTERS)[number]['value'])}
          className="h-9 rounded border border-slate-700 bg-control-inset px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-signal-green"
        >
          {KIND_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label htmlFor="log-search" className="sr-only">
          Search log messages
        </label>
        <input
          id="log-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search plate, bay, or message…"
          className="h-9 w-60 rounded border border-slate-700 bg-control-inset px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-signal-green"
        />

        <span className="ml-auto text-xs text-slate-500">
          {filtered.length} event{filtered.length === 1 ? '' : 's'} · live tail
        </span>
      </div>

      <div className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel">
        <ActivityLog events={filtered} showFooterMeta />
      </div>
    </div>
  );
}
