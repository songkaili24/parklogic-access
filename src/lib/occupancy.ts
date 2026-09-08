import type { OccupancySummary, ParkingSpot, SpotStatus } from '@/lib/types';

/** Roll bay statuses into the canonical KPI summary (offline bays excluded from the rate). */
export function summarizeOccupancy(spots: ParkingSpot[]): OccupancySummary {
  const counts: Record<SpotStatus, number> = {
    available: 0,
    occupied: 0,
    reserved: 0,
    charging: 0,
    offline: 0,
  };
  for (const spot of spots) counts[spot.status] += 1;
  const inService = spots.length - counts.offline;
  return {
    total: spots.length,
    available: counts.available,
    occupied: counts.occupied,
    reserved: counts.reserved,
    charging: counts.charging,
    offline: counts.offline,
    occupancyRate:
      inService > 0 ? Math.round(((inService - counts.available) / inService) * 100) : 0,
  };
}
