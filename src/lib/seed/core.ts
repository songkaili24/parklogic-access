/** Garage geography + deterministic RNG shared by all seed generators. */

export const LEVELS = ['L1', 'L2', 'L3'] as const;
export type LevelId = (typeof LEVELS)[number];

export const LEVEL_NAMES: Record<LevelId, string> = {
  L1: 'Level 1 — Retail & Visitor',
  L2: 'Level 2 — Tenant Monthly',
  L3: 'Level 3 — Executive & EV',
};

export const ZONES: Record<LevelId, string[]> = {
  L1: ['A', 'B', 'C'],
  L2: ['C', 'D', 'E'],
  L3: ['F', 'G', 'H'],
};

/** Bay counts per zone — must total 120 across the three levels. */
export const ZONE_SIZE: Record<string, number> = {
  A: 12,
  B: 16,
  C1: 16, // L1 zone C
  C2: 14, // L2 zone C
  D: 14,
  E: 14,
  F: 8,
  G: 10,
  H: 16,
};

export function zoneSize(level: LevelId, zone: string): number {
  return (
    ZONE_SIZE[
      level === 'L2' && zone === 'C' ? 'C2' : level === 'L1' && zone === 'C' ? 'C1' : zone
    ] ?? 12
  );
}

/** Deterministic RNG so the garage snapshot is stable across reloads. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
