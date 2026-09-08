import { Metadata } from 'next';

import { PageHeader } from '@/components/layout/PageHeader';
import { AccessLogExplorer } from '@/components/logs/AccessLogExplorer';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Access Logs',
  description: 'Live tail of gate entries, exits, pass events, and access-control holds.',
};

export default function AccessLogsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Access Logs"
        subtitle="Live tail from gate ANPR readers, kiosk terminals, and the EV network."
        actions={
          <Button variant="secondary" size="sm">
            Export CSV
          </Button>
        }
      />
      <AccessLogExplorer />
    </div>
  );
}
