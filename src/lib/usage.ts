export interface SpaceUsageDay {
  /** ISO date, e.g. 2026-09-07. */
  date: string;
  occupancyPct: number;
  gateEvents: number;
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic 30-day usage history for a bay, seeded from its id so the
 * same bay always shows the same history without persisting anything.
 * Weekdays run busy (65–98%), weekends quiet (5–25%).
 */
export function generateUsageHistory(
  spotId: string,
  days = 30,
  now: number = Date.now(),
): SpaceUsageDay[] {
  const rng = mulberry32(hashId(spotId));
  const out: SpaceUsageDay[] = [];

  for (let i = days; i >= 1; i--) {
    const day = new Date(now - i * 86_400_000);
    const weekend = day.getDay() === 0 || day.getDay() === 6;
    const base = weekend ? 5 + rng() * 20 : 65 + rng() * 33;
    out.push({
      date: day.toISOString().slice(0, 10),
      occupancyPct: Math.round(base),
      gateEvents: weekend ? Math.round(1 + rng() * 3) : Math.round(3 + rng() * 6),
    });
  }
  return out;
}
