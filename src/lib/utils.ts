/** Shared utilities. No app state in here — keep it pure. */

/** Conditional className join (tiny clsx). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

let uidCounter = 0;

/** Collision-safe id for client-generated records (events, passes, alerts). */
export function uid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${uidCounter.toString(36)}`;
}

/** 24h clock, e.g. "07:55:12". */
export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** "just now" / "4m ago" / "2h 15m ago" / "3d ago" */
export function relativeTime(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** 90 -> "1h 30m"; 45 -> "45m"; 1500 -> "25h" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** Compact percentage, floor-rounded for "spaces remaining" honesty. */
export function occupancyRate(available: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round(((total - available) / total) * 100);
}
