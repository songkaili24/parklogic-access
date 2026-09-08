'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { ParkingGrid } from '@/components/dashboard/ParkingGrid';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AlertCenter, LiveActivityFeed } from '@/components/dashboard/LiveFeeds';
import { StatsRow } from '@/components/ui/StatCard';
import { useRealtime } from '@/lib/realtime';

/** Consumes the app-shell RealtimeProvider — do not nest another provider here. */
export function DashboardBody() {
  const { summary, connection } = useRealtime();

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

      <StatsRow summary={summary} />

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
