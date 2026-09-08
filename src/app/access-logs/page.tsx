import { redirect } from 'next/navigation';

/** Backward-compat redirect: access logs moved to /logs. */
export default function AccessLogsRedirect(): never {
  redirect('/logs');
}
