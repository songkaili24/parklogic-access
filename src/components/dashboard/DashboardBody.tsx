'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { ParkingGrid } from '@/components/dashboard/ParkingGrid';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AlertCenter, LiveActivityFeed } from '@/components/dashboard/LiveFeeds';
import { StatsRow } from '@/components/ui/StatCard';
import { OccupancyGauge } from '@/components/ui/OccupancyGauge';
import { useRealtime } from '@/lib/realtime';
import { HOURLY_OCCUPANCY_PROFILE } from '@/lib/constants';

/** Closest hour bucket from the typical weekday profile. */
function typicalForNow(now: number): { pct: number; hour: string } {
  const hour = new Date(now).getHours();
  const clamped = Math.min(18, Math.max(5, hour));
  const bucket =
    HOURLY_OCCUPANCY_PROFILE.find((entry) => Number(entry.hour) === clamped) ??
    HOURLY_OCCUPANCY_PROFILE[0]!;
  return { pct: bucket.pct, hour: bucket.hour };
}

/** Consumes the app-shell RealtimeProvider — do not nest another provider here. */
export function DashboardBody() {
  const { summary, connection, now } = useRealtime();
  const peak = HOURLY_OCCUPANCY_PROFILE.reduce((best, entry) =>
    entry.pct > best.pct ? entry : best,
  );
  const typical = typicalForNow(now);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Live Dashboard"
        subtitle={
          connection === 'connected'
            ? 'Telemetry streaming from gate ANPR, bay sensors, and the EV network.'
            : 'Establishing connection to the gate telemetry bus…'
        }
      />

      <div className="grid gap-3 xl:grid-cols-[1fr_16rem]">
        <StatsRow summary={summary} />
        <OccupancyGauge
          rate={summary.occupancyRate}
          peakPct={peak.pct}
          peakHour={peak.hour}
          typicalPct={typical.pct}
          currentHour={typical.hour}
        />
      </div>

      <ParkingGrid />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <LiveActivityFeed max={10} />
        </div>
        <div className="space-y-4">
          <QuickActions />
          <AlertCenter />
        </div>
      </div>
    </div>
  );
}
