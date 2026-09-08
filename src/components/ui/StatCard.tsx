'use client';

import * as React from 'react';

import type { OccupancySummary } from '@/lib/types';
import { cn } from '@/lib/utils';
import { IconTrendDown, IconTrendUp } from '@/components/ui/Icons';

const ACCENTS = {
  green: 'text-status-available',
  red: 'text-status-occupied',
  amber: 'text-status-reserved',
  blue: 'text-status-charging',
  slate: 'text-slate-300',
} as const;

export type StatAccent = keyof typeof ACCENTS;

export interface StatCardProps {
  label: string;
  /** Current reading; numerics are tweened for the live-counter feel. */
  value: number | string;
  unit?: string;
  accent?: StatAccent;
  /** Small contextual line, e.g. "of 96 in service". */
  hint?: string;
  delta?: { value: number; label: string };
  /** Pulsing live indicator. */
  live?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  unit,
  accent = 'slate',
  hint,
  delta,
  live = false,
  icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xs uppercase tracking-widest text-slate-400">{label}</h3>
        {live && (
          <span
            className="h-2 w-2 animate-pulse-dot rounded-full bg-status-available"
            title="Receiving live telemetry"
            aria-label="Live"
          />
        )}
        {icon && <span className="text-lg text-slate-500">{icon}</span>}
      </div>

      <p className="mt-2 flex items-baseline gap-1">
        <span className={cn('font-numeric font-display text-3xl font-semibold', ACCENTS[accent])}>
          {typeof value === 'number' ? value.toLocaleString('en-US') : value}
        </span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </p>

      {(hint || delta) && (
        <div className="mt-1 flex items-center justify-between gap-2">
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
          {delta && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium',
                delta.value >= 0 ? 'text-status-available' : 'text-status-occupied',
              )}
            >
              {delta.value >= 0 ? <IconTrendUp /> : <IconTrendDown />}
              {delta.value >= 0 ? '+' : ''}
              {delta.value}
              {delta.label && <span className="text-slate-500"> {delta.label}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export interface OccupancyStatsProps {
  summary: OccupancySummary;
}

/** Convenience wrapper: the four canonical garage KPIs in a row. */
export function StatsRow({ summary }: OccupancyStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <StatCard
        label="Occupancy"
        value={summary.occupancyRate}
        unit="%"
        accent={summary.occupancyRate > 85 ? 'red' : summary.occupancyRate > 65 ? 'amber' : 'green'}
        hint={`${summary.occupied + summary.charging + summary.reserved} of ${summary.total} bays`}
        live
      />
      <StatCard
        label="Total Spaces"
        value={summary.total}
        accent="slate"
        hint="In service + offline"
      />
      <StatCard
        label="Occupied"
        value={summary.occupied}
        accent="red"
        hint="Vehicles parked"
        live
      />
      <StatCard
        label="Available"
        value={summary.available}
        unit="bays"
        accent="green"
        hint="Ready for allocation"
        live
      />
      <StatCard
        label="Reserved"
        value={summary.reserved}
        unit="bays"
        accent="amber"
        hint="Permit holds active"
      />
      <StatCard
        label="EV Charging"
        value={summary.charging}
        unit="sessions"
        accent="blue"
        hint="Ports drawing load"
        live
      />
    </div>
  );
}
