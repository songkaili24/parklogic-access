'use client';

import { DURATION_PRESETS } from '@/lib/constants';
import { cn, formatDuration } from '@/lib/utils';

export interface TimePickerProps {
  /** Selected duration in minutes. */
  value: number;
  onChange: (minutes: number) => void;
  /** Optional custom step (minutes) for the stepper. */
  stepMinutes?: number;
  minMinutes?: number;
  maxMinutes?: number;
  className?: string;
}

/**
 * Reservation-duration picker: preset windows as a radio group plus a
 * stepper for off-menu durations. Semantically a radiogroup.
 */
export function TimePicker({
  value,
  onChange,
  stepMinutes = 30,
  minMinutes = 30,
  maxMinutes = 1440,
  className,
}: TimePickerProps) {
  const isPreset = DURATION_PRESETS.some((preset) => preset.minutes === value);

  const clamp = (minutes: number) => Math.min(maxMinutes, Math.max(minMinutes, minutes));

  return (
    <div className={cn('space-y-2', className)}>
      <div role="radiogroup" aria-label="Reservation duration" className="flex flex-wrap gap-1.5">
        {DURATION_PRESETS.map((preset) => {
          const selected = preset.minutes === value;
          return (
            <button
              key={preset.minutes}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(preset.minutes)}
              className={cn(
                'rounded border px-2.5 py-1 font-display text-xs tracking-wide transition-colors',
                selected
                  ? 'border-signal-green bg-signal-green/15 text-signal-green'
                  : 'border-slate-700 bg-control-raised text-slate-400 hover:border-slate-500 hover:text-slate-200',
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Custom:</span>
        <div className="inline-flex items-center overflow-hidden rounded border border-slate-700">
          <button
            type="button"
            aria-label="Decrease duration"
            onClick={() => onChange(clamp(value - stepMinutes))}
            disabled={value <= minMinutes}
            className="h-7 w-7 bg-control-raised font-display text-slate-300 transition-colors hover:bg-control-overlay disabled:opacity-40"
          >
            −
          </button>
          <span
            className={cn(
              'font-numeric min-w-[5rem] px-2 text-center font-display text-sm',
              isPreset ? 'text-slate-400' : 'text-signal-green',
            )}
          >
            {formatDuration(value)}
          </span>
          <button
            type="button"
            aria-label="Increase duration"
            onClick={() => onChange(clamp(value + stepMinutes))}
            disabled={value >= maxMinutes}
            className="h-7 w-7 bg-control-raised font-display text-slate-300 transition-colors hover:bg-control-overlay disabled:opacity-40"
          >
            +
          </button>
        </div>
        <span className="text-xs text-slate-500">max 24 hr</span>
      </div>
    </div>
  );
}
