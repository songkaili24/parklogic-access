import { Metadata } from 'next';

import { PageHeader } from '@/components/layout/PageHeader';
import { BillingBoard } from '@/components/billing/BillingBoard';

export const metadata: Metadata = {
  title: 'Billing',
  description: 'Permit-holder invoicing, payment tracking, and receipt downloads.',
};

export default function BillingPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Billing"
        subtitle="Monthly invoicing for permit holders with payment status and receipts."
      />
      <BillingBoard />
    </div>
  );
}
