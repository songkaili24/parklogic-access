import { Metadata } from 'next';

import { PageHeader } from '@/components/layout/PageHeader';
import { EvChargingBoard } from '@/components/ev/EvChargingBoard';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'EV Charging Stations',
  description: 'Monitor charge banks, port utilization, and load-shedding status.',
};

export default function EvChargingPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="EV Charging Stations"
        subtitle="OCPP-connected charge banks, live load, and bay-level session status."
        actions={
          <Button variant="secondary" size="sm">
            Load Policy
          </Button>
        }
      />
      <EvChargingBoard />
    </div>
  );
}
