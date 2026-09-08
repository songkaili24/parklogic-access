'use client';

import * as React from 'react';

import type { ParkingSpot } from '@/lib/types';
import { LEVEL_NAMES, LEVELS, ZONES, type LevelId } from '@/lib/seed';
import { useRealtime } from '@/lib/realtime';
import { cn } from '@/lib/utils';
import { ParkingSpotCell } from '@/components/ui/ParkingSpotCell';
import { Badge } from '@/components/ui/Badge';
import { GarageMapPlaceholder } from '@/components/ui/GarageMapPlaceholder';

const LEGEND: Array<{ status: ParkingSpot['status']; label: string }> = [
  { status: 'available', label: 'Available' },
  { status: 'occupied', label: 'Occupied' },
  { status: 'reserved', label: 'Reserved' },
  { status: 'charging', label: 'EV Charging' },
  { status: 'offline', label: 'Offline' },
];

function ZoneBlock({ zone, spots }: { zone: string; spots: ParkingSpot[] }) {
  if (spots.length === 0) return null;
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 font-display text-xs uppercase tracking-widest text-slate-500">
        Zone {zone}
      </legend>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(2.6rem, 1fr))' }}
      >
        {spots.map((spot) => (
          <ParkingSpotCell key={spot.id} spot={spot} />
        ))}
      </div>
    </fieldset>
  );
}

export function ParkingGrid({ className }: { className?: string }) {
  const { spots } = useRealtime();
  const [level, setLevel] = React.useState<LevelId>('L1');
  const [selected, setSelected] = React.useState<ParkingSpot | null>(null);

  const levelSpots = React.useMemo(() => spots.filter((s) => s.level === level), [spots, level]);
  const availableHere = levelSpots.filter((s) => s.status === 'available').length;

  const zones = React.useMemo(
    () =>
      ZONES[level].map((zone) => {
        const zoneSpots = levelSpots.filter((s) => s.zone === zone);
        return {
          name: zone,
          label: `Zone ${zone}`,
          total: zoneSpots.length,
          available: zoneSpots.filter((s) => s.status === 'available').length,
        };
      }),
    [level, levelSpots],
  );

  return (
    <section aria-label="Parking lot visualization" className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-sm uppercase tracking-widest text-slate-400">
            {LEVEL_NAMES[level]}
          </h2>
          <Badge tone="available" dot>
            {availableHere} open
          </Badge>
        </div>

        <nav aria-label="Select level" className="flex gap-1">
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={l === level}
              onClick={() => {
                setLevel(l);
                setSelected(null);
              }}
              className={cn(
                'rounded px-3 py-1 font-display text-sm tracking-widest transition-colors',
                l === level
                  ? 'bg-signal-green/15 text-signal-green'
                  : 'text-slate-400 hover:bg-control-raised hover:text-slate-200',
              )}
            >
              {l}
            </button>
          ))}
        </nav>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-4 rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel">
          {LEVELS.map((l) => (
            <div
              key={l}
              className={cn(l !== level && 'hidden')}
              role="tabpanel"
              aria-label={LEVEL_NAMES[l]}
            >
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {ZONES[l].map((zone) => (
                  <ZoneBlock
                    key={zone}
                    zone={zone}
                    spots={spots.filter((s) => s.level === l && s.zone === zone)}
                  />
                ))}
              </div>
            </div>
          ))}

          <ul
            className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-800 pt-3"
            aria-label="Status legend"
          >
            {LEGEND.map(({ status, label }) => (
              <li key={status} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-sm border',
                    status === 'available' && 'border-status-available bg-status-available/40',
                    status === 'occupied' && 'border-status-occupied bg-status-occupied/40',
                    status === 'reserved' && 'border-status-reserved bg-status-reserved/40',
                    status === 'charging' && 'border-status-charging bg-status-charging/60',
                    status === 'offline' && 'border-dashed border-slate-600',
                  )}
                />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <GarageMapPlaceholder
            levels={LEVELS.map((l) => {
              const ls = spots.filter((s) => s.level === l);
              return {
                id: l,
                label: l,
                total: ls.length,
                available: ls.filter((s) => s.status === 'available').length,
              };
            })}
            activeLevel={level}
            onSelectLevel={(id) => setLevel(id as LevelId)}
            zones={zones}
          />

          {selected && (
            <aside
              aria-label="Selected bay detail"
              className="rounded border border-slate-700/70 bg-control-raised p-3 shadow-panel"
            >
              <header className="flex items-center justify-between">
                <h3 className="font-display text-sm uppercase tracking-widest text-white">
                  Bay {selected.id}
                </h3>
                <Badge tone={selected.status} dot={selected.status !== 'offline'}>
                  {selected.status}
                </Badge>
              </header>
              <dl className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Type</dt>
                  <dd className="capitalize text-slate-200">{selected.type}</dd>
                </div>
                {selected.permit && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Permit</dt>
                    <dd className="capitalize text-slate-200">{selected.permit}</dd>
                  </div>
                )}
                {selected.plate && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Vehicle</dt>
                    <dd className="font-display tracking-wider text-slate-200">{selected.plate}</dd>
                  </div>
                )}
              </dl>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}
