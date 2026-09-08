'use client';

import * as React from 'react';

import type { ParkingSpot, PermitHolder } from '@/lib/types';
import { useRealtime } from '@/lib/realtime';

/** Holder lookup by id. */
export function useHolderMap(): Map<string, PermitHolder> {
  const { holders } = useRealtime();
  return React.useMemo(() => new Map(holders.map((holder) => [holder.id, holder])), [holders]);
}

export function useSpotsForLevel(level: string): ParkingSpot[] {
  const { spots } = useRealtime();
  return React.useMemo(() => spots.filter((spot) => spot.level === level), [spots, level]);
}

export interface LevelStats {
  level: string;
  total: number;
  available: number;
  occupied: number;
  reserved: number;
  charging: number;
  offline: number;
}

/** Per-level occupancy rollup for the level selector. */
export function useLevelStats(): LevelStats[] {
  const { spots } = useRealtime();
  return React.useMemo(() => {
    const byLevel = new Map<string, LevelStats>();
    for (const spot of spots) {
      const stats = byLevel.get(spot.level) ?? {
        level: spot.level,
        total: 0,
        available: 0,
        occupied: 0,
        reserved: 0,
        charging: 0,
        offline: 0,
      };
      stats.total += 1;
      stats[spot.status] += 1;
      byLevel.set(spot.level, stats);
    }
    return [...byLevel.values()].sort((a, b) => a.level.localeCompare(b.level));
  }, [spots]);
}
