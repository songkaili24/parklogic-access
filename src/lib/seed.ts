import type {
  ActivityEvent,
  ParkingSpot,
  PermitType,
  SpotStatus,
  SpotType,
  SystemAlert,
} from '@/lib/types';
import { PLATE_POOL } from '@/lib/constants';
import { uid } from '@/lib/utils';

export const LEVELS = ['L1', 'L2', 'L3'] as const;
export type LevelId = (typeof LEVELS)[number];

export const LEVEL_NAMES: Record<LevelId, string> = {
  L1: 'Level 1 — Retail & Visitor',
  L2: 'Level 2 — Tenant Reserved',
  L3: 'Level 3 — Executive & EV',
};

export const ZONES: Record<LevelId, string[]> = {
  L1: ['A', 'B', 'C'],
  L2: ['C', 'D', 'E'],
  L3: ['F', 'G'],
};

/** Zone letter semantics across the garage. */
function zoneType(zone: string): SpotType {
  switch (zone) {
    case 'A':
      return 'visitor';
    case 'B':
      return 'standard';
    case 'F':
      return 'ev';
    case 'G':
      return 'accessible';
    default:
      return 'standard';
  }
}

/** Ramp-side spots in each zone run hot — realistic entry congestion. */
const RAMP_ADJACENT = new Set([1, 8, 9, 16]);

function permitFor(type: SpotType, zone: string): PermitType | undefined {
  if (type === 'visitor') return 'visitor';
  if (type === 'ev') return 'tenant';
  if (type === 'accessible') return 'tenant';
  if (zone === 'G' || zone === 'F') return 'executive';
  if (zone === 'C' || zone === 'D') return 'tenant';
  return Math.random() < 0.12 ? 'contractor' : 'tenant';
}

function statusFor(type: SpotType, nearRamp: boolean): SpotStatus {
  if (type === 'ev') {
    const roll = Math.random();
    if (roll < 0.45) return 'charging';
    if (roll < 0.75) return 'available';
    return 'reserved';
  }
  const roll = Math.random() * (nearRamp ? 0.8 : 1);
  if (roll < 0.52) return 'occupied';
  if (roll < 0.78) return 'available';
  if (roll < 0.9) return 'reserved';
  return Math.random() < 0.06 ? 'offline' : 'occupied';
}

/** Deterministic-ish garage snapshot: 96 spots across L1–L3. */
export function generateSpots(): ParkingSpot[] {
  const spots: ParkingSpot[] = [];
  const plates = [...PLATE_POOL];

  for (const level of LEVELS) {
    for (const zone of ZONES[level]) {
      const count = zone === 'G' ? 6 : 12;
      for (let i = 1; i <= count; i++) {
        const id = `${level}-${zone}${String(i).padStart(2, '0')}`;
        const type = zoneType(zone);
        const nearRamp = RAMP_ADJACENT.has(i);
        const status = statusFor(type, nearRamp);
        const isActive = status === 'occupied' || status === 'charging' || status === 'reserved';
        spots.push({
          id,
          level,
          zone,
          status,
          type,
          permit: permitFor(type, zone),
          plate: isActive ? plates[(spots.length + i * 3) % plates.length] : undefined,
          occupiedSince: isActive
            ? Date.now() - Math.floor(Math.random() * 4 + 1) * 900_000
            : undefined,
          updatedAt: Date.now() - Math.floor(Math.random() * 300_000),
        });
      }
    }
  }
  return spots;
}

export function generateInitialEvents(): ActivityEvent[] {
  const base = Date.now();
  const events: Array<[number, ActivityEvent['kind'], string, string, string?]> = [
    [8_000, 'entry', 'ANPR match — gate arm raised at P1 entry', '7KJH221', 'L2-C04'],
    [12_500, 'pass_issued', 'Visitor pass issued to Sarah Chen', 'Front desk', 'L1-A02'],
    [21_000, 'exit', 'Ticket validated — tenant exit at P2', '4TRN890'],
    [34_000, 'charge_started', 'Charging session started on port 2', 'GDX-4451', 'L3-F05'],
    [47_000, 'allocation', 'Reserved block L2-D07…D10 released to overflow', 'Building Operations'],
    [62_000, 'gate_hold', 'Gate hold — unregistered plate at P1 entry', 'UNKNOWN-441'],
    [75_000, 'entry', 'Contractor check-in — badge 4471', 'HLM-2207', 'L1-B11'],
    [88_000, 'pass_revoked', 'Expired pass revoked — 4h window elapsed', 'Front desk', 'L1-A05'],
    [96_000, 'exit', 'ANPR match — exit at P2', '9QWD113'],
    [110_000, 'charge_complete', 'Charging complete — 22.4 kWh delivered', '6ZPB554', 'L3-F03'],
  ];

  return events.map(([offset, kind, message, actor, spot], idx) => ({
    id: uid('evt'),
    timestamp: base - offset,
    kind,
    message,
    actor,
    spot,
    _seq: idx,
  })) as ActivityEvent[];
}

export function generateInitialAlerts(): SystemAlert[] {
  return [
    {
      id: uid('alr'),
      severity: 'critical',
      title: 'Gate hold active — P1 entry',
      message:
        'Unregistered plate at P1 entry lane. Visitor lane queue forming; dispatch guard or issue temp pass.',
      source: 'Access Control / P1 Entry',
      raisedAt: Date.now() - 74_000,
      acknowledged: false,
    },
    {
      id: uid('alr'),
      severity: 'warning',
      title: 'EV load shedding enabled',
      message:
        'Transformer T2 at 84% capacity. Charger bank L3-F capped at 7.2 kW per port until load drops.',
      source: 'EV Network / Transformer T2',
      raisedAt: Date.now() - 22 * 60_000,
      acknowledged: false,
    },
    {
      id: uid('alr'),
      severity: 'info',
      title: 'Contractor block assigned',
      message: 'L1-B09…B12 allocated to Meridian facade crew, 07:00–15:00 today.',
      source: 'Allocations',
      raisedAt: Date.now() - 48 * 60_000,
      acknowledged: true,
    },
  ];
}
