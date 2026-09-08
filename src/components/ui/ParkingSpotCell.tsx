'use client';

import type { ParkingSpot, SpotStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const statusClasses: Record<SpotStatus, string> = {
  available:
    'border-status-available/60 bg-status-available/10 text-status-available hover:bg-status-available/25',
  occupied:
    'border-status-occupied/60 bg-status-occupied/10 text-status-occupied hover:bg-status-occupied/25',
  reserved:
    'border-status-reserved/60 bg-status-reserved/10 text-status-reserved hover:bg-status-reserved/25',
  charging:
    'border-status-charging/70 bg-status-charging/15 text-status-charging shadow-glow-blue hover:bg-status-charging/30',
  offline: 'border-dashed border-slate-600/70 bg-transparent text-slate-500',
};

const statusRing: Partial<Record<SpotStatus, string>> = {
  charging: 'ring-1 ring-status-charging/40',
};

/** Compact glyph for bay type, drawn under the spot number. */
function TypeGlyph({ type }: { type: ParkingSpot['type'] }) {
  switch (type) {
    case 'ev':
      return <span title="EV charging bay">⚡</span>;
    case 'accessible':
      return <span title="Accessible bay">♿</span>;
    case 'visitor':
      return <span title="Visitor bay">V</span>;
    case 'motorcycle':
      return <span title="Motorcycle bay">M</span>;
    case 'compact':
      return <span title="Compact bay">C</span>;
    default:
      return null;
  }
}

export interface ParkingSpotCellProps {
  spot: ParkingSpot;
  selected?: boolean;
  onSelect?: (spot: ParkingSpot) => void;
  /** Roving tabindex for keyboard grid navigation (managed by the grid). */
  tabIndex?: number;
  className?: string;
}

/**
 * One bay in the lot grid. Purely presentational — status flows in from the
 * realtime store, so a WebSocket swap needs no change here.
 */
export function ParkingSpotCell({
  spot,
  selected = false,
  onSelect,
  tabIndex,
  className,
}: ParkingSpotCellProps) {
  const label = `${spot.id} — ${spot.status}${spot.plate ? ` · ${spot.plate}` : ''}`;

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={selected}
      onClick={() => onSelect?.(spot)}
      tabIndex={tabIndex}
      className={cn(
        'relative flex aspect-square flex-col items-center justify-center rounded-sm border font-display',
        'text-[11px] leading-none transition-all duration-150',
        statusClasses[spot.status],
        statusRing[spot.status],
        selected && 'outline outline-2 outline-offset-1 outline-white',
        spot.status === 'offline' && 'cursor-not-allowed',
        className,
      )}
    >
      {spot.status === 'charging' && (
        <span className="absolute inset-x-1 top-1 h-px animate-sweep bg-status-charging/70" />
      )}
      <span className="font-semibold">{spot.id.split('-')[1]}</span>
      <TypeGlyph type={spot.type} />
    </button>
  );
}
