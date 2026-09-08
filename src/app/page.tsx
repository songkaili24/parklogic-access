import { Metadata } from 'next';

import { DashboardBody } from '@/components/dashboard/DashboardBody';

export const metadata: Metadata = {
  title: 'Live Dashboard',
};

export default function DashboardPage() {
  return <DashboardBody />;
}
