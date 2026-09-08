'use client';

import type { SystemAlert } from '@/lib/types';
import { cn, relativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { IconAlertTriangle, IconX } from '@/components/ui/Icons';

const severityStyles: Record<SystemAlert['severity'], string> = {
  info: 'border-status-charging/50 bg-status-charging/10 text-status-charging',
  warning: 'border-status-reserved/50 bg-status-reserved/10 text-status-reserved',
  critical: 'border-status-occupied/60 bg-status-occupied/10 text-status-occupied',
};

export interface AlertBannerProps {
  alert: SystemAlert;
  onAcknowledge?: (id: string) => void;
  onDismiss?: (id: string) => void;
  className?: string;
}

export function AlertBanner({ alert, onAcknowledge, onDismiss, className }: AlertBannerProps) {
  const Icon = alert.severity === 'info' ? undefined : IconAlertTriangle;

  return (
    <section
      role={alert.severity === 'critical' ? 'alert' : 'status'}
      aria-label={`${alert.severity}: ${alert.title}`}
      className={cn(
        'flex items-start gap-3 rounded border px-4 py-3',
        severityStyles[alert.severity],
        alert.acknowledged && 'opacity-55',
        className,
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            'mt-0.5 shrink-0 text-lg',
            alert.severity === 'critical' && 'animate-pulse-dot-fast',
          )}
        />
      )}

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-baseline gap-x-2">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider">
            {alert.title}
          </h3>
          <span className="text-xs text-slate-500">
            {alert.source} ·{' '}
            <time dateTime={new Date(alert.raisedAt).toISOString()} suppressHydrationWarning>
              {relativeTime(alert.raisedAt)}
            </time>
          </span>
        </header>
        <p className="mt-0.5 text-sm text-slate-300">{alert.message}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {onAcknowledge && !alert.acknowledged && (
          <Button variant="outline" size="sm" onClick={() => onAcknowledge(alert.id)}>
            Acknowledge
          </Button>
        )}
        {alert.acknowledged && (
          <span className="font-display text-xs uppercase tracking-widest text-slate-500">
            Acked
          </span>
        )}
        {onDismiss && (
          <button
            type="button"
            aria-label="Dismiss alert"
            onClick={() => onDismiss(alert.id)}
            className="rounded p-1 text-slate-500 transition-colors hover:text-slate-200"
          >
            <IconX />
          </button>
        )}
      </div>
    </section>
  );
}
