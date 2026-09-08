'use client';

import type { InputHTMLAttributes } from 'react';

import { normalizePlateInput, validatePlate } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { IconCheck, IconX } from '@/components/ui/Icons';

export interface LicensePlateInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
> {
  value: string;
  /** Receives the sanitized (uppercased, length-capped) input. */
  onChange: (value: string) => void;
  /** Show validation state; off for pre-filled read-mostly uses. */
  showValidation?: boolean;
  /** Called with the latest validation result. */
  onValidityChange?: (valid: boolean) => void;
}

/**
 * Gate-side plate entry: uppercase, separator-tolerant, validated against
 * US plate conventions (2–8 alphanumeric characters).
 */
export function LicensePlateInput({
  value,
  onChange,
  onValidityChange,
  showValidation = true,
  className,
  ...props
}: LicensePlateInputProps) {
  const validation = validatePlate(value);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = normalizePlateInput(event.target.value);
    onChange(next);
    onValidityChange?.(validatePlate(next).valid);
  };

  const touched = value.length > 0;

  return (
    <div className={className}>
      <label htmlFor={props.id ?? 'license-plate'} className="sr-only">
        Vehicle license plate
      </label>
      <div className="relative">
        <input
          {...props}
          id={props.id ?? 'license-plate'}
          value={value}
          onChange={handleChange}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="ABC-1234"
          aria-invalid={showValidation && touched && !validation.valid}
          aria-describedby={showValidation && touched ? 'license-plate-status' : undefined}
          className={cn(
            'h-10 w-full rounded border bg-control-inset px-3 pr-9 font-display text-sm uppercase tracking-[0.2em]',
            'text-white placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-600',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-control',
            showValidation && touched && validation.valid
              ? 'border-status-available/60 focus:ring-status-available'
              : showValidation && touched && !validation.valid
                ? 'border-status-occupied/60 focus:ring-status-occupied'
                : 'border-slate-700 focus:ring-signal-green',
          )}
        />
        {showValidation && touched && (
          <span className="absolute inset-y-0 right-3 flex items-center" aria-hidden="true">
            {validation.valid ? (
              <IconCheck className="text-status-available" />
            ) : (
              <IconX className="text-status-occupied" />
            )}
          </span>
        )}
      </div>

      {showValidation && touched && (
        <p
          id="license-plate-status"
          role="status"
          className={cn(
            'mt-1 text-xs',
            validation.valid ? 'text-status-available' : 'text-status-occupied',
          )}
        >
          {validation.valid
            ? `Valid plate — gate entry as ${validation.normalized}`
            : validation.error}
        </p>
      )}
    </div>
  );
}
