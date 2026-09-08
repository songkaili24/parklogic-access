import Link from 'next/link';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'quickAction';
export type ButtonSize = 'sm' | 'md' | 'lg';

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-display font-medium tracking-wide ' +
  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-green ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-control disabled:pointer-events-none disabled:opacity-50';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-signal-green text-control-inset shadow-glow-green hover:bg-emerald-400 active:bg-emerald-500',
  secondary:
    'border border-slate-600/70 bg-control-overlay text-slate-100 hover:border-slate-500 hover:bg-slate-600/40',
  outline:
    'border border-slate-500/70 bg-transparent text-slate-200 hover:border-signal-green/70 hover:text-white',
  quickAction:
    'flex-col items-start gap-1.5 border border-slate-700/80 bg-control-raised p-3 text-left ' +
    'shadow-panel hover:border-signal-green/50 hover:bg-control-overlay',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

const quickActionSize: Record<ButtonSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders as a next/link when provided (keeps styling identical). */
  href?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', href, className, children, type, ...props },
  ref,
) {
  const classes = cn(
    baseClasses,
    variantClasses[variant],
    variant === 'quickAction' ? quickActionSize[size] : sizeClasses[size],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button ref={ref} type={type ?? 'button'} className={classes} {...props}>
      {children}
    </button>
  );
});
