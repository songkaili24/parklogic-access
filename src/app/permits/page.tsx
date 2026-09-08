import { Metadata } from 'next';

import { PageHeader } from '@/components/layout/PageHeader';
import { PermitDirectory } from '@/components/permits/PermitDirectory';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Permit Holders',
  description: 'Tenant, executive, and contractor permit registry with assigned bays.',
};

export default function PermitHoldersPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Permit Holders"
        subtitle="Registry of tenant, executive, contractor, and valet permits with bay assignments."
        actions={
          <Button variant="secondary" size="sm">
            Import Roster
          </Button>
        }
      />
      <PermitDirectory />
    </div>
  );
}
