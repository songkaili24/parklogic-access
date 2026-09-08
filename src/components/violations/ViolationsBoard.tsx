'use client';

import * as React from 'react';

import type { Violation, ViolationStatus } from '@/lib/types';
import { useRealtime } from '@/lib/realtime';
import { cn, relativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AppealForm, EvidencePlaceholder } from '@/components/violations/AppealForm';

const STATUS_TONE: Record<
  ViolationStatus,
  'critical' | 'warning' | 'success' | 'info' | 'neutral'
> = {
  open: 'critical',
  contested: 'warning',
  upheld: 'info',
  dismissed: 'neutral',
  paid: 'success',
};

const KIND_LABELS: Record<Violation['kind'], string> = {
  unauthorized_parking: 'Unauthorized Parking',
  overtime: 'Overtime',
  expired_permit: 'Expired Permit',
  fire_lane: 'Fire Lane',
  improper_use: 'Improper Use',
};

function money(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function ViolationCard({ violation }: { violation: Violation }) {
  const { resolveViolation } = useRealtime();
  const [appealOpen, setAppealOpen] = React.useState(false);
  const terminal =
    violation.status === 'upheld' ||
    violation.status === 'dismissed' ||
    violation.status === 'paid';

  return (
    <article className="flex flex-col gap-3 rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-white">
            {violation.code}
          </h3>
          <p className="text-xs text-slate-500">
            {KIND_LABELS[violation.kind]}
            {violation.spot ? ` · ${violation.spot}` : ''} · issued by {violation.issuedBy}
          </p>
        </div>
        <Badge tone={STATUS_TONE[violation.status]} dot={violation.status === 'open'}>
          {violation.status}
        </Badge>
      </header>

      <div className="flex gap-3">
        <EvidencePlaceholder violation={violation} />
        <dl className="min-w-0 flex-1 space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-slate-500">Plate</dt>
            <dd className="font-display tracking-wider text-slate-200">{violation.plate}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Fine</dt>
            <dd className="font-numeric text-slate-200">{money(violation.fineCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Issued</dt>
            <dd className="font-numeric text-slate-400" suppressHydrationWarning>
              {relativeTime(violation.issuedAt)}
            </dd>
          </div>
          {violation.resolvedAt && (
            <div className="flex justify-between">
              <dt className="text-slate-500">Resolved</dt>
              <dd className="font-numeric text-slate-400" suppressHydrationWarning>
                {relativeTime(violation.resolvedAt)}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <p className="text-xs leading-relaxed text-slate-400">{violation.detail}</p>

      {violation.appeal && (
        <div className="rounded border border-slate-800 bg-control p-3">
          <p className="flex items-baseline justify-between text-xs">
            <span className="font-display uppercase tracking-widest text-slate-400">
              Appeal · {violation.appeal.status}
            </span>
            <time
              dateTime={new Date(violation.appeal.submittedAt).toISOString()}
              suppressHydrationWarning
              className="font-numeric text-slate-500"
            >
              {relativeTime(violation.appeal.submittedAt)}
            </time>
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            {violation.appeal.statement}
          </p>
          {violation.appeal.evidenceFileName && (
            <p className="mt-1 text-xs text-status-charging">
              Evidence: {violation.appeal.evidenceFileName}
            </p>
          )}
        </div>
      )}

      <footer className="mt-auto border-t border-slate-800 pt-2">
        {appealOpen ? (
          <AppealForm violation={violation} onDone={() => setAppealOpen(false)} />
        ) : (
          <div className="flex flex-wrap justify-end gap-2">
            {!violation.appeal && !terminal && (
              <Button variant="secondary" size="sm" onClick={() => setAppealOpen(true)}>
                File Appeal
              </Button>
            )}
            {!terminal && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resolveViolation(violation.id, 'dismissed')}
                >
                  Dismiss
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resolveViolation(violation.id, 'upheld')}
                >
                  Uphold
                </Button>
              </>
            )}
          </div>
        )}
      </footer>
    </article>
  );
}

const STATUS_FILTERS: Array<ViolationStatus | 'all'> = [
  'all',
  'open',
  'contested',
  'upheld',
  'dismissed',
  'paid',
];

export function ViolationsBoard() {
  const { violations } = useRealtime();
  const [filter, setFilter] = React.useState<ViolationStatus | 'all'>('all');
  const [query, setQuery] = React.useState('');

  const filtered = violations.filter((violation) => {
    if (filter !== 'all' && violation.status !== filter) return false;
    const q = query.trim().toLowerCase();
    if (
      q &&
      !violation.plate.toLowerCase().includes(q.replace(/[-\s]/g, '')) &&
      !violation.code.toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });

  const openFines = violations
    .filter((v) => v.status === 'open' || v.status === 'contested')
    .reduce((sum, v) => sum + v.fineCents, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="radiogroup" aria-label="Filter by status" className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              role="radio"
              aria-checked={filter === status}
              onClick={() => setFilter(status)}
              className={cn(
                'rounded border px-2.5 py-1 font-display text-xs uppercase tracking-widest transition-colors',
                filter === status
                  ? 'border-signal-green bg-signal-green/15 text-signal-green'
                  : 'border-slate-700 text-slate-400 hover:text-slate-200',
              )}
            >
              {status}
            </button>
          ))}
        </div>

        <label htmlFor="violation-search" className="sr-only">
          Search by plate or citation number
        </label>
        <input
          id="violation-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Plate or citation #…"
          className="ml-auto h-9 w-48 rounded border border-slate-700 bg-control-inset px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-signal-green"
        />
      </div>

      <p className="text-xs text-slate-500">
        {filtered.length} citation{filtered.length === 1 ? '' : 's'} ·{' '}
        <span className="font-numeric">${(openFines / 100).toFixed(0)}</span> outstanding across
        open and contested cases
      </p>

      <section aria-label="Citations" className="grid gap-3 lg:grid-cols-2">
        {filtered.map((violation) => (
          <ViolationCard key={violation.id} violation={violation} />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full rounded border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
            No citations match — adjust the filter or search.
          </p>
        )}
      </section>
    </div>
  );
}
