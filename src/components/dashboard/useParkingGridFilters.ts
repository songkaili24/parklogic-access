'use client';

import * as React from 'react';

import type { ParkingSpot, PermitType, VehicleClass } from '@/lib/types';
import { LEVELS } from '@/lib/seed';
import type { PermitHolder } from '@/lib/types';

export interface ParkingGridFilters {
  query: string;
  permitFilter: PermitType | 'all';
  classFilter: VehicleClass | 'all';
  filtersActive: boolean;
  totalMatches: number;
  matches: (spot: ParkingSpot) => boolean;
  visibleZoneSpots: ParkingSpot[][];
  setLevelIfMatching: (level: string) => void;
}

export interface UseParkingGridFiltersArgs {
  spots: ParkingSpot[];
  levelSpots: ParkingSpot[];
  level: string;
  setLevel: (level: string) => void;
  holderMap: Map<string, PermitHolder>;
  query: string;
  permitFilter: PermitType | 'all';
  classFilter: VehicleClass | 'all';
}

/**
 * Cross-level search + filter matching for the bay grid. Matches on other
 * levels prompt the caller to switch the visible level.
 */
export function useParkingGridFilters({
  spots,
  levelSpots,
  level,
  setLevel,
  holderMap,
  query,
  permitFilter,
  classFilter,
}: UseParkingGridFiltersArgs): ParkingGridFilters {
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
  }, [filtersActive, levelMatches.length, totalMatches, spots, matches, level, setLevel]);

  const visibleZoneSpots = React.useMemo(() => {
    const visible = new Set((filtersActive ? levelMatches : levelSpots).map((s) => s.id));
    const zones: string[] = [...new Set(levelSpots.map((s) => s.zone))];
    return zones
      .map((zone) => levelSpots.filter((s) => s.zone === zone && visible.has(s.id)))
      .filter((zoneSpots) => zoneSpots.length > 0);
  }, [levelSpots, levelMatches, filtersActive]);

  return { query, permitFilter, classFilter, filtersActive, totalMatches, matches, visibleZoneSpots, setLevelIfMatching: setLevel };
}
