import { Metadata } from 'next';

import { PageHeader } from '@/components/layout/PageHeader';
import { ViolationsBoard } from '@/components/violations/ViolationsBoard';

export const metadata: Metadata = {
  title: 'Violations',
  description: 'Citation management with ANPR evidence, appeals, and resolution tracking.',
};

export default function ViolationsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Violations"
        subtitle="ANPR-evidenced citations with appeal intake and enforcement-desk resolution."
      />
      <ViolationsBoard />
    </div>
  );
}
