'use client';

import type { PermitType, VehicleClass } from '@/lib/types';
import { PERMIT_TYPE_LABELS, VEHICLE_CLASS_LABELS } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { IconSearch } from '@/components/ui/Icons';

export const PERMIT_FILTERS: Array<PermitType | 'all'> = [
  'all',
  'monthly',
  'annual',
  'executive',
  'overflow',
  'contractor',
  'valet',
];

export const CLASS_FILTERS: Array<VehicleClass | 'all'> = [
  'all',
  'sedan',
  'suv',
  'pickup',
  'van',
  'ev',
  'motorcycle',
];

export interface ParkingGridToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  permitFilter: PermitType | 'all';
  onPermitFilterChange: (filter: PermitType | 'all') => void;
  classFilter: VehicleClass | 'all';
  onClassFilterChange: (filter: VehicleClass | 'all') => void;
  filtersActive: boolean;
  onClear: () => void;
  levelStat?: { occupied: number; charging: number; total: number; offline: number };
}

/** Search + filter bar above the bay grid. */
export function ParkingGridToolbar({
  query,
  onQueryChange,
  permitFilter,
  onPermitFilterChange,
  classFilter,
  onClassFilterChange,
  filtersActive,
  onClear,
  levelStat,
}: ParkingGridToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded border border-slate-700/70 bg-control-raised p-3 shadow-panel">
      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <label htmlFor="grid-search" className="sr-only">
          Search by bay, plate, or permit holder
        </label>
        <input
          id="grid-search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
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
        onChange={(e) => onPermitFilterChange(e.target.value as PermitType | 'all')}
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
        onChange={(e) => onClassFilterChange(e.target.value as VehicleClass | 'all')}
        className="h-9 rounded border border-slate-700 bg-control-inset px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-signal-green"
      >
        {CLASS_FILTERS.map((vehicleClass) => (
          <option key={vehicleClass} value={vehicleClass}>
            {vehicleClass === 'all' ? 'All vehicle classes' : VEHICLE_CLASS_LABELS[vehicleClass]}
          </option>
        ))}
      </select>

      {filtersActive && (
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear
        </Button>
      )}

      {levelStat && (
        <span className="font-numeric ml-auto text-xs text-slate-500">
          {levelStat.occupied + levelStat.charging}/{levelStat.total} occupied · {levelStat.offline}{' '}
          offline
        </span>
      )}
    </div>
  );
}
