'use client';

import * as React from 'react';

import type { PermitType, WaitlistEntry } from '@/lib/types';
import { PERMIT_TYPE_LABELS } from '@/lib/constants';
import { permitStatus } from '@/lib/permits';
import { downloadCsv } from '@/lib/csv';
import { useRealtime } from '@/lib/realtime';
import { cn, relativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconSearch } from '@/components/ui/Icons';
import { NewPermitDialog } from '@/components/permits/NewPermitDialog';

const PERMIT_FILTERS: Array<PermitType | 'all'> = [
  'all',
  'monthly',
  'annual',
  'executive',
  'overflow',
];

export function PermitDirectory() {
  const { holders, waitlist } = useRealtime();
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<PermitType | 'all'>('all');
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const filtered = holders.filter((holder) => {
    const matchesFilter = filter === 'all' || holder.permitType === filter;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      q.length === 0 ||
      holder.name.toLowerCase().includes(q) ||
      holder.plate.replace(/[-\s]/g, '').toLowerCase().includes(q.replace(/[-\s]/g, ''));
    return matchesFilter && matchesQuery;
  });

  const exportCsv = () => {
    downloadCsv(
      `parklogic-permits-${new Date().toISOString().slice(0, 10)}.csv`,
      ['ID', 'Name', 'Company', 'Permit Type', 'Plate', 'Vehicle', 'Assigned Bay', 'Valid Through'],
      filtered.map((holder) => [
        holder.id,
        holder.name,
        holder.company,
        PERMIT_TYPE_LABELS[holder.permitType],
        holder.plate,
        holder.vehicle,
        holder.assignedBay ?? 'unassigned',
        holder.validThrough,
      ]),
    );
  };

  const waitlistByType = waitlist.reduce<Record<string, WaitlistEntry[]>>((acc, entry) => {
    (acc[entry.permitType] ??= []).push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <label htmlFor="permit-search" className="sr-only">
            Search permit holders by name or license plate
          </label>
          <input
            id="permit-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or plate…"
            className="h-9 w-64 rounded border border-slate-700 bg-control-inset pl-8 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-signal-green"
          />
        </div>

        <div role="radiogroup" aria-label="Filter by permit type" className="flex flex-wrap gap-1">
          {PERMIT_FILTERS.map((permit) => (
            <button
              key={permit}
              type="button"
              role="radio"
              aria-checked={filter === permit}
              onClick={() => setFilter(permit)}
              className={cn(
                'rounded border px-2.5 py-1 font-display text-xs uppercase tracking-widest transition-colors',
                filter === permit
                  ? 'border-signal-green bg-signal-green/15 text-signal-green'
                  : 'border-slate-700 text-slate-400 hover:text-slate-200',
              )}
            >
              {permit === 'all' ? 'All' : PERMIT_TYPE_LABELS[permit]}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {filtered.length} of {holders.length}
          </span>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => setDialogOpen(true)}>
            New Permit
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-slate-700/70 bg-control-raised shadow-panel">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <caption className="sr-only">Permit holders with assignments and renewal status</caption>
          <thead>
            <tr className="border-b border-slate-800 font-display text-xs uppercase tracking-widest text-slate-500">
              <th scope="col" className="px-4 py-2.5">
                Holder
              </th>
              <th scope="col" className="px-4 py-2.5">
                Permit
              </th>
              <th scope="col" className="px-4 py-2.5">
                Plate
              </th>
              <th scope="col" className="px-4 py-2.5">
                Vehicle
              </th>
              <th scope="col" className="px-4 py-2.5">
                Space
              </th>
              <th scope="col" className="px-4 py-2.5">
                Expiry
              </th>
              <th scope="col" className="px-4 py-2.5">
                Renewal
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((holder) => {
              const status = permitStatus(holder.validThrough);
              return (
                <tr
                  key={holder.id}
                  className="border-b border-slate-800/60 last:border-0 hover:bg-control-overlay/50"
                >
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-slate-100">{holder.name}</span>
                    <span className="block text-xs text-slate-500">{holder.company}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={holder.permitType}>{PERMIT_TYPE_LABELS[holder.permitType]}</Badge>
                  </td>
                  <td className="px-4 py-2.5 font-display tracking-wider text-slate-200">
                    {holder.plate}
                  </td>
                  <td className="px-4 py-2.5 text-slate-300">{holder.vehicle}</td>
                  <td className="px-4 py-2.5 font-display tracking-wider">
                    {holder.assignedBay ? (
                      <span className="text-signal-green">{holder.assignedBay}</span>
                    ) : (
                      <span className="text-slate-500">unassigned</span>
                    )}
                  </td>
                  <td className="font-numeric px-4 py-2.5 text-slate-400">{holder.validThrough}</td>
                  <td className="px-4 py-2.5">
                    {status === 'expired' ? (
                      <Badge tone="critical" dot>
                        Expired
                      </Badge>
                    ) : status === 'expiring' ? (
                      <Badge tone="warning" dot>
                        Due &lt;30d
                      </Badge>
                    ) : (
                      <Badge tone="success">Current</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  No permits match — adjust the search or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <section
        aria-label="Permit waitlist"
        className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel"
      >
        <h2 className="font-display text-sm uppercase tracking-widest text-slate-400">
          Waitlist by Category
        </h2>
        {Object.keys(waitlistByType).length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No waitlisted applicants.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {Object.entries(waitlistByType).map(([type, entries]) => (
              <li key={type} className="rounded border border-slate-800 bg-control px-3 py-2">
                <div className="flex items-center justify-between">
                  <Badge tone={type as PermitType}>{PERMIT_TYPE_LABELS[type as PermitType]}</Badge>
                  <span className="text-xs text-slate-500">{entries.length} waiting</span>
                </div>
                <ol className="mt-2 space-y-1 text-xs text-slate-400">
                  {entries.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between gap-2">
                      <span>
                        <span className="font-numeric text-slate-500">#{entry.position}</span>{' '}
                        {entry.name} — {entry.company}
                      </span>
                      <span className="text-slate-600">
                        requested {relativeTime(entry.requestedAt)}
                      </span>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        )}
      </section>

      {dialogOpen && <NewPermitDialog onClose={() => setDialogOpen(false)} />}
    </div>
  );
}
