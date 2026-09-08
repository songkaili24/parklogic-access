'use client';

import * as React from 'react';

import type { VisitorPass } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { formatDuration } from '@/lib/utils';

/** Deterministic pseudo-QR pattern derived from the pass code. */
function qrMatrix(code: string, size = 21): boolean[][] {
  let h = 2166136261;
  for (const ch of code) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  const next = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };

  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => next() > 0.52),
  );

  // Finder squares in three corners.
  const finder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const cell = grid[row + r]?.[col + c];
        if (cell === undefined) continue;
        const edge = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[row + r]![col + c] = edge || core;
      }
    }
  };
  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);

  return grid;
}

export function QrPlaceholder({ code, className }: { code: string; className?: string }) {
  const matrix = React.useMemo(() => qrMatrix(code), [code]);
  return (
    <div
      role="img"
      aria-label={`QR code for pass ${code}`}
      className={cn(
        'animate-qr-reveal',
        'grid gap-px rounded bg-white p-1.5 [grid-template-columns:repeat(21,minmax(0,1fr))]',
        className,
      )}
    >
      {matrix.flatMap((row, r) =>
        row.map((on, c) => (
          <span
            key={`${r}-${c}`}
            className={cn('aspect-square', on ? 'bg-control-inset' : 'bg-white')}
          />
        )),
      )}
    </div>
  );
}

export interface VisitorPassCardProps {
  pass: VisitorPass;
  /** Clock used for the countdown line. */
  now?: number;
  className?: string;
}

export function VisitorPassCard({ pass, now = Date.now(), className }: VisitorPassCardProps) {
  const remaining = Math.max(0, pass.validUntil - now);
  const expired = remaining === 0;

  return (
    <article
      className={cn(
        'flex gap-4 rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel',
        expired && 'opacity-60',
        className,
      )}
    >
      <QrPlaceholder code={pass.code} className="h-24 w-24 shrink-0" />

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-2">
          <h3 className="truncate font-display text-sm font-semibold uppercase tracking-widest text-white">
            {pass.guestName}
          </h3>
          <Badge tone={expired ? 'offline' : 'success'} dot={!expired}>
            {expired ? 'Expired' : pass.status}
          </Badge>
        </header>

        <p className="mt-0.5 truncate text-xs text-slate-400">
          {pass.code} · host: {pass.host}
        </p>

        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <div className="flex items-center justify-between gap-2 sm:col-span-1">
            <dt className="text-slate-500">Plate</dt>
            <dd className="font-display tracking-wider text-slate-200">{pass.plate}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-slate-500">Bay</dt>
            <dd className="font-display tracking-wider text-slate-200">
              {pass.level}-{pass.spot}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-slate-500">Window</dt>
            <dd className="font-numeric text-slate-200">
              {formatDuration(Math.round(remaining / 60_000))} left
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-slate-500">Lane</dt>
            <dd className="text-slate-200">Visitor / P1</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
