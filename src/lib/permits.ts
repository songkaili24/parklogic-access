/**
 * Permit status helpers: renewal windows are derived from the expiry date,
 * never stored, so they can't drift from the source of truth.
 */

export type PermitStatus = 'active' | 'expiring' | 'expired';

const EXPIRING_WINDOW_DAYS = 30;
const DAY_MS = 86_400_000;

export function permitStatus(validThrough: string, now: number = Date.now()): PermitStatus {
  const expiry = new Date(`${validThrough}T23:59:59`).getTime();
  if (Number.isNaN(expiry) || expiry < now) return 'expired';
  if (expiry - now <= EXPIRING_WINDOW_DAYS * DAY_MS) return 'expiring';
  return 'active';
}
