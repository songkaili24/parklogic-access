import { Metadata } from 'next';

import { PageHeader } from '@/components/layout/PageHeader';
import { HardwareBoard } from '@/components/hardware/HardwareBoard';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Hardware',
  description: 'Gate controller, ANPR camera, and sensor fleet health with reboot control.',
};

export default function HardwarePage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Hardware"
        subtitle="Fleet health across gate controllers, ANPR cameras, sensor hubs, and kiosks."
        actions={
          <Button variant="secondary" size="sm">
            Maintenance Calendar
          </Button>
        }
      />
      <HardwareBoard />
    </div>
  );
}
