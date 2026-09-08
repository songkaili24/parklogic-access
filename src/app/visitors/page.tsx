import { Metadata } from 'next';

import { PageHeader } from '@/components/layout/PageHeader';
import { VisitorManagement } from '@/components/visitors/VisitorManagement';

export const metadata: Metadata = {
  title: 'Visitor Management',
  description: 'Issue, track, and revoke visitor parking passes with QR gate access.',
};

export default function VisitorManagementPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Visitor Management"
        subtitle="Issue and pre-register QR passes, run event bulk generation, and audit visitor history."
      />
      <VisitorManagement />
    </div>
  );
}
