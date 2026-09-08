import { redirect } from 'next/navigation';

/** Backward-compat redirect: EV charging moved to /ev. */
export default function EvChargingRedirect(): never {
  redirect('/ev');
}
