'use client';

import * as React from 'react';

import { PROPERTIES } from '@/lib/constants';
import { useRealtime } from '@/lib/realtime';
import { cn, formatClock } from '@/lib/utils';
import { IconBell, IconBuilding, IconChevronDown, IconGate } from '@/components/ui/Icons';

function ConnectionBadge() {
  const { connection } = useRealtime();
  const meta: Record<typeof connection, { label: string; className: string }> = {
    connecting: {
      label: 'Connecting',
      className: 'bg-status-reserved/10 text-status-reserved border-status-reserved/40',
    },
    syncing: {
      label: 'Syncing',
      className: 'bg-status-reserved/10 text-status-reserved border-status-reserved/40',
    },
    connected: {
      label: 'Live',
      className: 'bg-status-available/10 text-status-available border-status-available/40',
    },
    offline: { label: 'Offline', className: 'bg-slate-800 text-slate-400 border-slate-600' },
  };
  const m = meta[connection];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-display text-xs uppercase tracking-widest',
        m.className,
      )}
      role="status"
      aria-label={`System connection: ${m.label}`}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full bg-current',
          (connection === 'connected' || connection === 'syncing') && 'animate-pulse-dot',
        )}
      />
      {m.label}
    </span>
  );
}

function OccupancyMeter() {
  const { summary, now } = useRealtime();
  const rate = summary.occupancyRate;
  const tone =
    rate > 85
      ? 'text-status-occupied'
      : rate > 65
        ? 'text-status-reserved'
        : 'text-status-available';

  return (
    <div className="flex items-center gap-2" title="Garage-wide occupancy across in-service bays">
      <div
        role="meter"
        aria-valuenow={rate}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Real-time occupancy"
        className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800"
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            rate > 85
              ? 'bg-status-occupied'
              : rate > 65
                ? 'bg-status-reserved'
                : 'bg-status-available',
          )}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className={cn('font-numeric font-display text-sm font-semibold tabular-nums', tone)}>
        {rate}%
      </span>
      <span className="hidden font-display text-[11px] uppercase tracking-widest text-slate-500 lg:inline">
        occ · {summary.available} free
      </span>
      <span
        suppressHydrationWarning
        className="font-numeric hidden text-xs text-slate-600 xl:inline"
      >
        {formatClock(now)}
      </span>
    </div>
  );
}

function NotificationBell() {
  const { alerts } = useRealtime();
  const unacknowledged = alerts.filter((a) => !a.acknowledged).length;

  return (
    <a
      href="#alerts"
      aria-label={
        unacknowledged > 0
          ? `${unacknowledged} unacknowledged system ${unacknowledged === 1 ? 'alert' : 'alerts'}`
          : 'No unacknowledged alerts'
      }
      className="relative rounded p-1.5 text-slate-400 transition-colors hover:bg-control-overlay hover:text-slate-100"
    >
      <IconBell className="text-lg" />
      {unacknowledged > 0 && (
        <span className="font-numeric absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-status-occupied px-1 text-[10px] font-bold text-white">
          {unacknowledged}
          <span
            className="absolute inset-0 animate-ping rounded-full bg-status-occupied/60"
            aria-hidden="true"
          />
        </span>
      )}
    </a>
  );
}

function PropertySelector() {
  const [propertyId, setPropertyId] = React.useState(PROPERTIES[0]!.id);
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const property = PROPERTIES.find((p) => p.id === propertyId) ?? PROPERTIES[0]!;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded border border-slate-700 bg-control-raised px-2.5 py-1.5 text-left transition-colors hover:border-slate-500"
      >
        <IconBuilding className="text-base text-slate-400" />
        <span className="max-w-[9rem] truncate font-display text-sm tracking-wide text-slate-100 sm:max-w-none">
          {property.shortName}
        </span>
        <IconChevronDown
          className={cn('text-sm text-slate-500 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Select property"
          className="absolute left-0 z-50 mt-1 w-72 rounded border border-slate-700 bg-control-raised py-1 shadow-panel"
        >
          {PROPERTIES.map((p) => (
            <li key={p.id} role="option" aria-selected={p.id === propertyId}>
              <button
                type="button"
                onClick={() => {
                  setPropertyId(p.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors hover:bg-control-overlay',
                  p.id === propertyId && 'bg-signal-green/10',
                )}
              >
                <span className="font-display text-sm tracking-wide text-slate-100">{p.name}</span>
                <span className="text-xs text-slate-500">
                  {p.levels} levels · {p.totalSpots} bays
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TopStatusBar() {
  const { connection } = useRealtime();
  const gateOnline = connection === 'connected' || connection === 'syncing';

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-slate-800 bg-control/95 px-3 backdrop-blur sm:gap-4 sm:px-4">
      <a href="/dashboard" className="flex items-center gap-2" aria-label="ParkLogic home">
        <IconGate className="text-xl text-signal-green" />
        <span className="font-display text-base font-bold uppercase tracking-widest text-white">
          Park<span className="text-signal-green">Logic</span>
        </span>
      </a>

      <div className="hidden h-6 w-px bg-slate-800 md:block" />

      <div className="hidden md:block">
        <PropertySelector />
      </div>

      <div className="ml-auto flex items-center gap-3 sm:gap-4">
        <OccupancyMeter />
        <ConnectionBadge />
        <span
          className="hidden items-center gap-1.5 font-display text-xs uppercase tracking-widest text-slate-400 lg:inline-flex"
          title="Gate controller heartbeat"
        >
          <IconGate
            className={cn(
              'text-base',
              gateOnline ? 'text-status-available' : 'text-status-offline',
            )}
          />
          Gates {gateOnline ? 'Online' : 'Down'}
        </span>
        <NotificationBell />
      </div>
    </header>
  );
}
