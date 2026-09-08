import type { GateEvent, GateId } from '@/lib/types';
import { PLATE_POOL } from '@/lib/constants';
import { uid } from '@/lib/utils';
import { makeRng } from '@/lib/seed/core';

const DENIAL_PLATES = ['UNKNOWN-441', 'XXT-9087', '8MJP303', 'QLB-2248', 'JDY-5013'];

/** 50 gate reads across the last ~5.5 hours, newest first. */
export function generateGateEvents(): GateEvent[] {
  const rng = makeRng(7);
  const events: GateEvent[] = [];
  const now = Date.now();

  for (let i = 0; i < 50; i++) {
    const timestamp = now - Math.floor((50 - i) * 396_000 + rng() * 120_000);
    const roll = rng();
    let eventType: GateEvent['eventType'];
    let result: GateEvent['result'] = 'granted';
    let plate: string;
    let gate: GateId;
    let detail: string | undefined;
    let violation: GateEvent['violation'];

    if (roll < 0.06) {
      eventType = 'denied';
      result = 'denied';
      violation = 'unauthorized';
      plate = DENIAL_PLATES[Math.floor(rng() * DENIAL_PLATES.length)] ?? 'UNKNOWN';
      gate = 'P1 Entry';
      detail = 'Plate not in permit registry or visitor ledger';
    } else if (roll < 0.08) {
      eventType = 'denied';
      result = 'denied';
      violation = 'expired_permit';
      plate = PLATE_POOL[7] ?? 'UNKNOWN';
      gate = 'P2 Entry';
      detail = 'Permit expired 2026-09-01 — renewal outstanding';
    } else if (roll < 0.1) {
      eventType = 'gate_hold';
      result = 'warning';
      plate = DENIAL_PLATES[0] ?? 'UNKNOWN';
      gate = 'P1 Entry';
      detail = 'Arm held for escorted delivery — control room override';
    } else if (roll < 0.36) {
      eventType = 'exit';
      gate = rng() < 0.5 ? 'P1 Exit' : 'P2 Exit';
      plate = PLATE_POOL[Math.floor(rng() * PLATE_POOL.length)] ?? 'UNKNOWN';
    } else {
      eventType = 'entry';
      gate = roll < 0.68 ? 'P1 Entry' : 'P2 Entry';
      plate = PLATE_POOL[Math.floor(rng() * PLATE_POOL.length)] ?? 'UNKNOWN';
      if (roll > 0.95) {
        gate = 'Commercial Dock';
        detail = 'Loading dock — dock 2 assigned';
      }
    }

    events.push({ id: uid('gat'), timestamp, eventType, plate, gate, result, detail, violation });
  }
  return events.reverse();
}
