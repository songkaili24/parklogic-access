'use client';

import { useRealtime } from '@/lib/realtime';
import { StatsRow } from '@/components/ui/StatCard';

/** Binds the canonical KPI row to the app-shell realtime context. */
export function LiveStatsRow() {
  const { summary } = useRealtime();
  return <StatsRow summary={summary} />;
}
