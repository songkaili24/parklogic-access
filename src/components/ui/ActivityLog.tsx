'use client';

import type { ActivityEvent, ActivityKind } from '@/lib/types';
import { cn, relativeTime } from '@/lib/utils';

const kindMeta: Record<ActivityKind, { label: string; dotClass: string; textClass: string }> = {
  entry: { label: 'IN', dotClass: 'bg-status-available', textClass: 'text-status-available' },
  exit: { label: 'OUT', dotClass: 'bg-slate-500', textClass: 'text-slate-400' },
  pass_issued: { label: 'PASS', dotClass: 'bg-status-charging', textClass: 'text-status-charging' },
  pass_revoked: {
    label: 'REVOKE',
    dotClass: 'bg-status-reserved',
    textClass: 'text-status-reserved',
  },
  charge_started: {
    label: 'CHG',
    dotClass: 'bg-status-charging',
    textClass: 'text-status-charging',
  },
  charge_complete: {
    label: 'DONE',
    dotClass: 'bg-status-available',
    textClass: 'text-status-available',
  },
  gate_hold: { label: 'HOLD', dotClass: 'bg-status-reserved', textClass: 'text-status-reserved' },
  alert_ack: { label: 'ACK', dotClass: 'bg-slate-500', textClass: 'text-slate-400' },
  allocation: { label: 'ALLOC', dotClass: 'bg-violet-400', textClass: 'text-violet-300' },
  maintenance: { label: 'MAINT', dotClass: 'bg-orange-400', textClass: 'text-orange-300' },
};

export interface ActivityLogProps {
  events: ActivityEvent[];
  /** Newest first is assumed; pass `max` to trim the feed. */
  max?: number;
  showFooterMeta?: boolean;
  className?: string;
}

export function ActivityLog({ events, max, showFooterMeta = false, className }: ActivityLogProps) {
  const visible = max ? events.slice(0, max) : events;

  if (visible.length === 0) {
    return (
      <p
        className={cn(
          'rounded border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500',
          className,
        )}
      >
        Awaiting telemetry — activity stream will populate once the gate bus connects.
      </p>
    );
  }

  return (
    <div className={className}>
      <ol className="space-y-0">
        {visible.map((event, index) => {
          const meta = kindMeta[event.kind];
          return (
            <li
              key={event.id}
              className={cn(
                'animate-log-entry relative flex gap-3 pb-3',
                index !== visible.length - 1 && 'border-l border-slate-800',
              )}
              style={{
                animationDelay: `${Math.min(index, 8) * 50}ms`,
                animationFillMode: 'backwards',
              }}
            >
              <span
                className={cn(
                  'relative z-10 ml-[-4.5px] mt-1.5 h-2 w-2 shrink-0 rounded-full',
                  meta.dotClass,
                )}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1 pl-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <span
                    className={cn(
                      'font-display text-[10px] uppercase tracking-widest',
                      meta.textClass,
                    )}
                  >
                    {meta.label}
                    {event.spot && <span className="ml-1.5 text-slate-500">{event.spot}</span>}
                  </span>
                  <time
                    dateTime={new Date(event.timestamp).toISOString()}
                    suppressHydrationWarning
                    className="font-numeric text-[11px] text-slate-500"
                  >
                    {relativeTime(event.timestamp)}
                  </time>
                </div>
                <p className="mt-0.5 truncate text-sm text-slate-300" title={event.message}>
                  {event.message}
                </p>
                {showFooterMeta && event.actor && (
                  <p className="text-[11px] text-slate-500">by {event.actor}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {showFooterMeta && (
        <p className="border-t border-slate-800 pt-2 text-[11px] text-slate-500">
          Streamed from gate ANPR, kiosk, and EV network controllers.
        </p>
      )}
    </div>
  );
}
