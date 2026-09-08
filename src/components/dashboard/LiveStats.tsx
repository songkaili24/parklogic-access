'use client';

import { useRealtime } from '@/lib/realtime';
import { SkeletonStat } from '@/components/dashboard/LiveSignals';
import { StatsRow } from '@/components/ui/StatCard';

/** Binds the canonical KPI row to the app-shell realtime context. */
export function LiveStatsRow() {
  const { summary, connection } = useRealtime();

  // Skeleton shimmer while the transport handshake populates the store.
  if (connection === 'connecting' || connection === 'syncing') {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" aria-busy="true">
        {['Total Spaces', 'Occupied', 'Available', 'Reserved', 'EV Charging'].map((label) => (
          <SkeletonStat key={label} label={label} />
        ))}
      </div>
    );
  }

  return <StatsRow summary={summary} />;
}
