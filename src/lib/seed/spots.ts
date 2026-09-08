import type { ParkingSpot, PermitType, SpotStatus, SpotType } from '@/lib/types';
import { PLATE_POOL } from '@/lib/constants';
import { LEVELS, ZONES, makeRng, zoneSize, type LevelId } from '@/lib/seed/core';
import type { PermitHolder } from '@/lib/types';

function zoneType(level: LevelId, zone: string, position: number): SpotType {
  if (zone === 'A') return 'visitor';
  if (zone === 'F') return 'ev';
  if (zone === 'G' && position >= 9) return 'accessible';
  return 'standard';
}

/** Permit restriction enforced per zone. */
function zonePermit(level: LevelId, zone: string, rng: () => number): PermitType | undefined {
  if (zone === 'A') return undefined; // visitor ledger controls access
  if (zone === 'F') return 'monthly';
  if (zone === 'G') return 'executive';
  if (level === 'L2') return 'monthly';
  return rng() < 0.12 ? 'contractor' : 'overflow';
}

/**
 * Snapshot targets: 78 occupied (~65%), 25 available, 11 reserved,
 * 3 charging, 3 offline. Visitor passes hold L1-A01…A05; permit
 * assignments hold 12 bays (7 of them currently parked).
 */
const PARKED_HOLDERS = new Set([
  'L3-G01',
  'L3-G02',
  'L2-C01',
  'L2-C04',
  'L2-C10',
  'L2-D01',
  'L2-D07',
]);
const VISITOR_HELD = new Set(['L1-A01', 'L1-A02', 'L1-A03', 'L1-A04', 'L1-A05']);
const EV_STATUS: SpotStatus[] = [
  'charging',
  'charging',
  'charging',
  'available',
  'available',
  'available',
  'reserved',
  'offline',
];
const OFFLINE_BAYS = new Set(['L1-B03', 'L2-E09', 'L3-H12']);

export function generateSpots(holders: PermitHolder[] = []): ParkingSpot[] {
  const rng = makeRng(42);
  const holderByBay = new Map<string, PermitHolder>();
  for (const holder of holders) {
    if (holder.assignedBay) holderByBay.set(holder.assignedBay, holder);
  }

  const spots: ParkingSpot[] = [];
  let generalOccupied = 0;
  const GENERAL_OCCUPIED_TARGET = 70;
  let plateIndex = 20;

  for (const level of LEVELS) {
    for (const zone of ZONES[level]) {
      const count = zoneSize(level, zone);
      for (let i = 1; i <= count; i++) {
        const id = `${level}-${zone}${String(i).padStart(2, '0')}`;
        const type = zoneType(level, zone, i);
        let status: SpotStatus;
        let plate: string | undefined;
        let holderId: string | undefined;
        let occupiedSince: number | undefined;

        if (type === 'ev') {
          status = EV_STATUS[i - 1] ?? 'available';
          if (status === 'charging') {
            plate = PLATE_POOL[(i + 4) % PLATE_POOL.length];
            occupiedSince = Date.now() - Math.floor(rng() * 90 + 15) * 60_000;
          }
        } else if (VISITOR_HELD.has(id)) {
          status = 'reserved';
          plate = PLATE_POOL[(i + 9) % PLATE_POOL.length];
        } else if (holderByBay.has(id)) {
          const holder = holderByBay.get(id)!;
          holderId = holder.id;
          const parked = PARKED_HOLDERS.has(id);
          status = parked ? 'occupied' : 'reserved';
          if (parked) {
            plate = holder.plate;
            occupiedSince = Date.now() - Math.floor(rng() * 200 + 30) * 60_000;
          }
        } else if (OFFLINE_BAYS.has(id)) {
          status = 'offline';
        } else if (generalOccupied < GENERAL_OCCUPIED_TARGET && rng() < 0.78) {
          status = 'occupied';
          generalOccupied += 1;
          plate = PLATE_POOL[plateIndex++ % PLATE_POOL.length];
          occupiedSince = Date.now() - Math.floor(rng() * 280 + 12) * 60_000;
        } else {
          status = 'available';
        }

        spots.push({
          id,
          level,
          zone,
          status,
          type,
          permit: holderId ? holderByBay.get(id)!.permitType : zonePermit(level, zone, rng),
          holderId,
          vehicleClass: type === 'ev' ? 'ev' : undefined,
          plate,
          occupiedSince,
          updatedAt: Date.now() - Math.floor(rng() * 300_000),
        });
      }
    }
  }
  return spots;
}
