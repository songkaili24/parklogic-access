'use client';

import * as React from 'react';

import { useRealtime } from '@/lib/realtime';
import { cn } from '@/lib/utils';

/** Bay ids that changed state within the pulse window. */
export function useRecentlyChanged(): Set<string> {
  const { recentlyChanged } = useRealtime();
  return React.useMemo(() => new Set(recentlyChanged), [recentlyChanged]);
}

export interface SkeletonStatProps {
  label: string;
  className?: string;
}

/**
 * Shimmering placeholder shown while dashboard KPIs refresh — e.g. during
 * the provider handshake or a transport reconnect.
 */
export function SkeletonStat({ label, className }: SkeletonStatProps) {
  return (
    <div
      className={cn(
        'rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel',
        className,
      )}
      role="status"
      aria-label={`${label} — loading`}
    >
      <span className="animate-skeleton block h-3 w-20 rounded bg-slate-700" />
      <span className="animate-skeleton mt-3 block h-8 w-24 rounded bg-slate-800" />
      <span className="animate-skeleton mt-2 block h-2.5 w-28 rounded bg-slate-800" />
    </div>
  );
}
