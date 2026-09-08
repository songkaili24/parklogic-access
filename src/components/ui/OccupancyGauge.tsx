'use client';

import { cn } from '@/lib/utils';

export interface OccupancyGaugeProps {
  /** Current occupancy rate, 0–100. */
  rate: number;
  /** Predicted peak for the operating day. */
  peakPct: number;
  peakHour: string;
  /** Typical rate for the current hour, for the delta line. */
  typicalPct?: number;
  currentHour?: string;
  className?: string;
}

const RADIUS = 80;
const ARC_LENGTH = Math.PI * RADIUS;

function rateColor(rate: number): string {
  if (rate > 85) return 'text-status-occupied';
  if (rate > 65) return 'text-status-reserved';
  return 'text-status-available';
}

/**
 * Semicircular occupancy gauge with peak-hour prediction readout.
 * Purely presentational — the caller supplies live + predicted values.
 */
export function OccupancyGauge({
  rate,
  peakPct,
  peakHour,
  typicalPct,
  currentHour,
  className,
}: OccupancyGaugeProps) {
  const strokeColor =
    rate > 85
      ? 'stroke-status-occupied'
      : rate > 65
        ? 'stroke-status-reserved'
        : 'stroke-status-available';

  return (
    <section
      aria-label="Occupancy gauge"
      className={cn(
        'relative overflow-hidden rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel',
        className,
      )}
    >
      <h3 className="font-display text-xs uppercase tracking-widest text-slate-400">
        Live Occupancy
      </h3>

      <svg
        viewBox="0 0 200 112"
        role="img"
        aria-label={`Garage occupancy ${rate} percent`}
        className="mt-2 w-full"
      >
        <path
          d={`M ${100 - RADIUS} 100 A ${RADIUS} ${RADIUS} 0 0 1 ${100 + RADIUS} 100`}
          fill="none"
          strokeWidth={14}
          className="stroke-slate-800"
          strokeLinecap="round"
        />
        <path
          d={`M ${100 - RADIUS} 100 A ${RADIUS} ${RADIUS} 0 0 1 ${100 + RADIUS} 100`}
          fill="none"
          strokeWidth={14}
          className={cn(strokeColor, 'transition-all duration-700')}
          strokeLinecap="round"
          strokeDasharray={`${(rate / 100) * ARC_LENGTH} ${ARC_LENGTH}`}
        />
        <text
          x={100}
          y={84}
          textAnchor="middle"
          className={cn(
            'font-numeric fill-current font-display text-4xl font-semibold',
            rateColor(rate),
          )}
        >
          {rate}%
        </text>
        <text
          x={100}
          y={104}
          textAnchor="middle"
          className="fill-slate-500 font-sans text-[10px] uppercase tracking-widest"
        >
          occupied
        </text>
      </svg>

      <dl className="mt-2 space-y-1.5 border-t border-slate-800 pt-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-slate-500">Predicted peak</dt>
          <dd className="font-numeric flex items-center gap-1.5 text-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-status-reserved" aria-hidden="true" />
            {peakPct}% @ {peakHour}:00
          </dd>
        </div>
        {typicalPct !== undefined && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-slate-500">vs typical {currentHour ?? 'now'}</dt>
            <dd
              className={cn(
                'font-numeric font-medium',
                rate - typicalPct > 5
                  ? 'text-status-occupied'
                  : rate - typicalPct < -5
                    ? 'text-status-available'
                    : 'text-slate-300',
              )}
            >
              {rate - typicalPct >= 0 ? '+' : ''}
              {rate - typicalPct} pts
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
