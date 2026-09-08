'use client';

import * as React from 'react';

import type { ParkingSpot, PermitType, VehicleClass } from '@/lib/types';
import { LEVEL_NAMES, LEVELS, ZONES, type LevelId } from '@/lib/seed';
import { PERMIT_TYPE_LABELS, VEHICLE_CLASS_LABELS } from '@/lib/constants';
import { useRealtime } from '@/lib/realtime';
import { useHolderMap, useLevelStats } from '@/lib/selectors';
import { cn } from '@/lib/utils';
import { ParkingSpotCell } from '@/components/ui/ParkingSpotCell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GarageMapPlaceholder } from '@/components/ui/GarageMapPlaceholder';
import { SpaceDetailPanel } from '@/components/ui/SpaceDetailPanel';
import { IconSearch } from '@/components/ui/Icons';

const LEGEND: Array<{ status: ParkingSpot['status']; label: string; className: string }> = [
  {
    status: 'available',
    label: 'Available',
    className: 'border-status-available bg-status-available/40',
  },
  {
    status: 'occupied',
    label: 'Occupied',
    className: 'border-status-occupied bg-status-occupied/40',
  },
  {
    status: 'reserved',
    label: 'Reserved',
    className: 'border-status-reserved bg-status-reserved/40',
  },
  {
    status: 'charging',
    label: 'EV Charging',
    className: 'border-status-charging bg-status-charging/60',
  },
  {
    status: 'offline',
    label: 'Disabled / Maintenance',
    className: 'border-dashed border-slate-600',
  },
];

const PERMIT_FILTERS: Array<PermitType | 'all'> = [
  'all',
  'monthly',
  'annual',
  'executive',
  'overflow',
  'contractor',
  'valet',
];
const CLASS_FILTERS: Array<VehicleClass | 'all'> = [
  'all',
  'sedan',
  'suv',
  'pickup',
  'van',
  'ev',
  'motorcycle',
];

type RovingNav = 'next' | 'prev' | 'down' | 'up' | 'first' | 'last';

export function ParkingGrid({ className }: { className?: string }) {
  const { spots, now, reserveSpot, releaseSpot, reportSpotIssue } = useRealtime();
  const holderMap = useHolderMap();
  const levelStats = useLevelStats();

  const [level, setLevel] = React.useState<LevelId>('L1');
  const [query, setQuery] = React.useState('');
  const [permitFilter, setPermitFilter] = React.useState<PermitType | 'all'>('all');
  const [classFilter, setClassFilter] = React.useState<VehicleClass | 'all'>('all');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const cellRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());

  const selected = spots.find((spot) => spot.id === selectedId) ?? null;
  const levelSpots = React.useMemo(() => spots.filter((s) => s.level === level), [spots, level]);

  /**
   * Search + filters apply across ALL levels so operators can locate a bay
   * anywhere; matches on other levels switch the visible level.
   */
  const matches = React.useCallback(
    (spot: ParkingSpot) => {
      const q = query.trim().toLowerCase();
      if (q.length > 0) {
        const holder = spot.holderId ? holderMap.get(spot.holderId) : undefined;
        const hay = [spot.id, spot.plate ?? '', holder?.name ?? '', holder?.company ?? '']
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (permitFilter !== 'all' && (spot.permit ?? null) !== permitFilter) return false;
      if (classFilter !== 'all' && (spot.vehicleClass ?? null) !== classFilter) return false;
      return true;
    },
    [query, permitFilter, classFilter, holderMap],
  );

  const totalMatches = React.useMemo(() => spots.filter(matches).length, [spots, matches]);
  const levelMatches = React.useMemo(() => levelSpots.filter(matches), [levelSpots, matches]);
  const filtersActive = query.trim().length > 0 || permitFilter !== 'all' || classFilter !== 'all';

  // Keep the visible level on the first level with matches while filtering.
  React.useEffect(() => {
    if (filtersActive && levelMatches.length === 0 && totalMatches > 0) {
      const first = LEVELS.find((l) => spots.some((s) => s.level === l && matches(s)));
      if (first && first !== level) setLevel(first);
    }
  }, [filtersActive, levelMatches.length, totalMatches, spots, matches, level]);

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

  const visibleZoneSpots = React.useMemo(() => {
    const visible = new Set((filtersActive ? levelMatches : levelSpots).map((s) => s.id));
    return ZONES[level]
      .map((zone) => levelSpots.filter((s) => s.zone === zone && visible.has(s.id)))
      .filter((zoneSpots) => zoneSpots.length > 0);
  }, [level, levelSpots, levelMatches, filtersActive]);

  /** Roving focus: arrow keys move between bay cells, Home/End jump. */
  const moveFocus = React.useCallback(
    (fromId: string, dir: RovingNav) => {
      const ordered = visibleZoneSpots.flat();
      const index = ordered.findIndex((s) => s.id === fromId);
      if (index === -1 || ordered.length === 0) return;
      const rowLength = visibleZoneSpots[0]?.length ?? 1;
      const targetIndex =
        dir === 'next'
          ? Math.min(ordered.length - 1, index + 1)
          : dir === 'prev'
            ? Math.max(0, index - 1)
            : dir === 'down'
              ? Math.min(ordered.length - 1, index + rowLength)
              : dir === 'up'
                ? Math.max(0, index - rowLength)
                : dir === 'first'
                  ? 0
                  : ordered.length - 1;
      const next = ordered[targetIndex];
      if (!next) return;
      setSelectedId(next.id);
      cellRefs.current.get(next.id)?.focus();
    },
    [visibleZoneSpots],
  );

  const onGridKeyDown = (event: React.KeyboardEvent, spotId: string) => {
    const keyMap: Record<string, RovingNav> = {
      ArrowRight: 'next',
      ArrowLeft: 'prev',
      ArrowDown: 'down',
      ArrowUp: 'up',
      Home: 'first',
      End: 'last',
    };
    const dir = keyMap[event.key];
    if (dir) {
      event.preventDefault();
      moveFocus(spotId, dir);
    }
  };

  const levelStat = levelStats.find((s) => s.level === level);

  return (
    <section aria-label="Parking lot visualization" className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-sm uppercase tracking-widest text-slate-400">
            {LEVEL_NAMES[level]}
          </h2>
          <Badge tone="available" dot>
            {levelStat?.available ?? 0} open
          </Badge>
          {filtersActive && (
            <Badge tone="info">
              {totalMatches} match{totalMatches === 1 ? '' : 'es'}
            </Badge>
          )}
        </div>

        <nav aria-label="Garage levels" className="flex gap-1">
          {levelStats.map((stat) => (
            <button
              key={stat.level}
              type="button"
              aria-pressed={stat.level === level}
              onClick={() => {
                setLevel(stat.level as LevelId);
                setSelectedId(null);
              }}
              title={`${stat.level}: ${stat.available}/${stat.total} available`}
              className={cn(
                'rounded px-3 py-1 font-display text-sm tracking-widest transition-colors',
                stat.level === level
                  ? 'bg-signal-green/15 text-signal-green'
                  : 'text-slate-400 hover:bg-control-raised hover:text-slate-200',
              )}
            >
              {stat.level}
              <span className="font-numeric ml-1.5 text-[10px] text-slate-500">
                {stat.available}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded border border-slate-700/70 bg-control-raised p-3 shadow-panel">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <label htmlFor="grid-search" className="sr-only">
                Search by bay, plate, or permit holder
              </label>
              <input
                id="grid-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Bay, plate, or holder…"
                className="h-9 w-56 rounded border border-slate-700 bg-control-inset pl-8 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-signal-green"
              />
            </div>

            <label htmlFor="grid-permit-filter" className="sr-only">
              Filter by permit type
            </label>
            <select
              id="grid-permit-filter"
              value={permitFilter}
              onChange={(e) => setPermitFilter(e.target.value as PermitType | 'all')}
              className="h-9 rounded border border-slate-700 bg-control-inset px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-signal-green"
            >
              {PERMIT_FILTERS.map((permit) => (
                <option key={permit} value={permit}>
                  {permit === 'all' ? 'All permit types' : PERMIT_TYPE_LABELS[permit]}
                </option>
              ))}
            </select>

            <label htmlFor="grid-class-filter" className="sr-only">
              Filter by vehicle class
            </label>
            <select
              id="grid-class-filter"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value as VehicleClass | 'all')}
              className="h-9 rounded border border-slate-700 bg-control-inset px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-signal-green"
            >
              {CLASS_FILTERS.map((vehicleClass) => (
                <option key={vehicleClass} value={vehicleClass}>
                  {vehicleClass === 'all'
                    ? 'All vehicle classes'
                    : VEHICLE_CLASS_LABELS[vehicleClass]}
                </option>
              ))}
            </select>

            {filtersActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery('');
                  setPermitFilter('all');
                  setClassFilter('all');
                }}
              >
                Clear
              </Button>
            )}

            {levelStat && (
              <span className="font-numeric ml-auto text-xs text-slate-500">
                {levelStat.occupied + levelStat.charging}/{levelStat.total} occupied ·{' '}
                {levelStat.offline} offline
              </span>
            )}
          </div>

          <div className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel">
            {totalMatches > 0 || !filtersActive ? (
              <div className="space-y-5">
                {visibleZoneSpots.map((zoneSpots) => (
                  <fieldset key={zoneSpots[0]?.zone ?? 'Z'} className="min-w-0">
                    <legend className="mb-1.5 font-display text-xs uppercase tracking-widest text-slate-500">
                      Zone {zoneSpots[0]?.zone}
                      {filtersActive && ` (${zoneSpots.length})`}
                    </legend>
                    <div
                      className="grid gap-1"
                      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(2.6rem, 1fr))' }}
                    >
                      {zoneSpots.map((spot, index) => (
                        <div
                          key={spot.id}
                          onKeyDown={(e) => onGridKeyDown(e, spot.id)}
                          ref={(el) => {
                            const button = el?.querySelector('button');
                            if (button) cellRefs.current.set(spot.id, button);
                            else cellRefs.current.delete(spot.id);
                          }}
                        >
                          <ParkingSpotCell
                            spot={spot}
                            selected={selectedId === spot.id}
                            onSelect={(s) => setSelectedId(s.id)}
                            tabIndex={index === 0 ? 0 : -1}
                          />
                        </div>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">
                No bays match the current search or filters.
              </p>
            )}

            <ul
              className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-800 pt-3"
              aria-label="Status legend"
            >
              {LEGEND.map(({ status, label, className: swatch }) => (
                <li key={status} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span
                    className={cn('h-2.5 w-2.5 rounded-sm border', swatch)}
                    aria-hidden="true"
                  />
                  {label}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-slate-600">
              Arrow keys move between bays · selection opens detail · Home/End jump to grid edges.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {selected ? (
            <SpaceDetailPanel
              spot={selected}
              holder={selected.holderId ? holderMap.get(selected.holderId) : undefined}
              now={now}
              onClose={() => setSelectedId(null)}
              onAssignPermit={() => reserveSpot(selected.id)}
              onMarkAvailable={(id) => {
                releaseSpot(id);
                setSelectedId(null);
              }}
              onReportIssue={(id) => reportSpotIssue(id)}
            />
          ) : (
            <div className="space-y-3">
              <GarageMapPlaceholder
                levels={levelStats.map((stat) => ({
                  id: stat.level,
                  label: stat.level,
                  total: stat.total,
                  available: stat.available,
                }))}
                activeLevel={level}
                onSelectLevel={(id) => setLevel(id as LevelId)}
                zones={zones}
              />
              <p className="rounded border border-dashed border-slate-700 p-3 text-center text-xs text-slate-500">
                Select a bay to open its detail panel — permit holder, occupancy, and 30-day usage.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
