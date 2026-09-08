import { Metadata } from 'next';

import { PageHeader } from '@/components/layout/PageHeader';
import { ParkingGrid } from '@/components/dashboard/ParkingGrid';
import { LiveStatsRow } from '@/components/dashboard/LiveStats';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PERMIT_TYPE_LABELS } from '@/lib/constants';
import type { PermitType } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Parking Allocations',
  description: 'Allocate bays, manage reserved blocks, and monitor live bay status.',
};

const PERMIT_ZONE_RULES: Array<{ permit: PermitType; rule: string }> = [
  { permit: 'monthly', rule: 'L2 zones C–E · overnight allowed' },
  { permit: 'annual', rule: 'L2 reserved core · 24/7 access' },
  { permit: 'executive', rule: 'L3 zone G · EV bays exempt' },
  { permit: 'overflow', rule: 'L1 zones B–C · spill-over only' },
  { permit: 'contractor', rule: 'L1 zone B · 07:00–17:00 windows' },
  { permit: 'valet', rule: 'L1 zone C · valet key-keep lane' },
];

export default function ParkingAllocationsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Parking Allocations"
        subtitle="Assign bays, hold reserved blocks, and watch live status across every level."
        actions={
          <>
            <Button variant="secondary" size="sm">
              Hold Block
            </Button>
            <Button variant="primary" size="sm">
              New Allocation
            </Button>
          </>
        }
      />

      <LiveStatsRow />

      <ParkingGrid />

      <section
        aria-label="Permit-type allocation rules"
        className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel"
      >
        <h2 className="font-display text-sm uppercase tracking-widest text-slate-400">
          Allocation Rules by Permit Type
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PERMIT_ZONE_RULES.map(({ permit, rule }) => (
            <li
              key={permit}
              className="flex flex-col gap-1 rounded border border-slate-800 bg-control px-3 py-2"
            >
              <Badge tone={permit}>{PERMIT_TYPE_LABELS[permit]}</Badge>
              <span className="text-xs text-slate-500">{rule}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
