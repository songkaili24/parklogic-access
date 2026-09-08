import { redirect } from 'next/navigation';

/** Backward-compat redirect: the live dashboard moved to /dashboard. */
export default function RootPage(): never {
  redirect('/dashboard');
}
