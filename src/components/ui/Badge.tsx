import type { PermitType, SpotStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export type BadgeTone =
  SpotStatus | PermitType | 'neutral' | 'info' | 'warning' | 'critical' | 'success';

const toneClasses: Record<BadgeTone, string> = {
  available: 'border-status-available/40 bg-status-available/10 text-status-available',
  occupied: 'border-status-occupied/40 bg-status-occupied/10 text-status-occupied',
  reserved: 'border-status-reserved/40 bg-status-reserved/10 text-status-reserved',
  charging: 'border-status-charging/40 bg-status-charging/10 text-status-charging',
  offline: 'border-status-offline/40 bg-status-offline/10 text-slate-400',
  executive: 'border-violet-400/40 bg-violet-400/10 text-violet-300',
  tenant: 'border-sky-400/40 bg-sky-400/10 text-sky-300',
  contractor: 'border-orange-400/40 bg-orange-400/10 text-orange-300',
  visitor: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  valet: 'border-pink-400/40 bg-pink-400/10 text-pink-300',
  neutral: 'border-slate-600 bg-slate-800/60 text-slate-300',
  info: 'border-status-charging/40 bg-status-charging/10 text-status-charging',
  warning: 'border-status-reserved/40 bg-status-reserved/10 text-status-reserved',
  critical: 'border-status-occupied/40 bg-status-occupied/10 text-status-occupied',
  success: 'border-status-available/40 bg-status-available/10 text-status-available',
};

export interface BadgeProps {
  tone?: BadgeTone;
  /** Leading status dot — use for live states. */
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}

export function Badge({
  tone = 'neutral',
  dot = false,
  size = 'md',
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded border font-display uppercase tracking-widest',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        toneClasses[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-current" />}
      {children}
    </span>
  );
}
