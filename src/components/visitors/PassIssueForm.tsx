'use client';

import * as React from 'react';

import { TENANTS } from '@/lib/constants';
import { useRealtime } from '@/lib/realtime';
import { findDuplicatePlate, validateUpload } from '@/lib/edge-cases';
import { validatePlate } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LicensePlateInput } from '@/components/ui/LicensePlateInput';
import { TimePicker } from '@/components/ui/TimePicker';
import { IconQr } from '@/components/ui/Icons';

const inputClass =
  'h-10 w-full rounded border border-slate-700 bg-control-inset px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-signal-green';

function fieldLabel(id: string, text: string) {
  return (
    <label htmlFor={id} className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
      {text}
    </label>
  );
}

/** datetime-local value <-> epoch ms, in the operator's local zone. */
export function toLocalInputValue(ms: number): string {
  const date = new Date(ms - new Date(ms).getTimezoneOffset() * 60_000);
  return date.toISOString().slice(0, 16);
}

export interface PassIssueFormProps {
  /** Fires with the freshly issued pass, e.g. for immediate printing. */
  onIssued?: (code: string) => void;
}

/**
 * "Issue Visitor Pass" form: guest, company, host employee, validated plate,
 * expected arrival, and duration. Future arrivals pre-register the visit and
 * notify the host; immediate arrivals activate at the lane.
 */
export function PassIssueForm({ onIssued }: PassIssueFormProps) {
  const { issuePass, spots, passes } = useRealtime();

  const [guestName, setGuestName] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [host, setHost] = React.useState<string>(TENANTS[0]);
  const [plate, setPlate] = React.useState('');
  const [arrival, setArrival] = React.useState(() => toLocalInputValue(Date.now()));
  const [duration, setDuration] = React.useState(120);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [idScan, setIdScan] = React.useState<File | null>(null);
  const [idScanError, setIdScanError] = React.useState<string | null>(null);

  const visitorBays = React.useMemo(() => spots.filter((s) => s.type === 'visitor'), [spots]);
  const openVisitorBays = visitorBays.filter((s) => s.status === 'available');

  const handleIssue = (event: React.FormEvent) => {
    event.preventDefault();
    const validFrom = new Date(arrival).getTime() || Date.now();
    const plateCheck = validatePlate(plate);
    if (!guestName.trim()) {
      setFormError('Visitor name is required for gate ANPR matching.');
      return;
    }
    if (idScan) {
      const scanCheck = validateUpload(idScan, 'vehicle_registration');
      if (!scanCheck.valid) {
        setFormError(scanCheck.error ?? 'ID scan failed validation.');
        return;
      }
    }
    if (!plateCheck.valid) {
      setFormError(plateCheck.error ?? 'Plate failed validation.');
      return;
    }
    const duplicate = findDuplicatePlate({
      plate: plateCheck.normalized,
      validFrom,
      passes,
    });
    if (!duplicate.valid) {
      setFormError(duplicate.error ?? 'Duplicate plate registration.');
      return;
    }
    if (openVisitorBays.length === 0) {
      setFormError('No open visitor bays — release a held bay or use the valet lane.');
      return;
    }

    const pass = issuePass({
      guestName: guestName.trim(),
      company: company.trim() || undefined,
      host,
      plate: plateCheck.normalized,
      validFrom,
      validUntil: validFrom + duration * 60_000,
    });
    setGuestName('');
    setCompany('');
    setPlate('');
    setFormError(null);
    onIssued?.(pass.code);
  };

  return (
    <section
      aria-label="Issue visitor pass"
      className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel"
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm uppercase tracking-widest text-slate-400">
          Issue Visitor Pass
        </h2>
        <IconQr className="text-lg text-slate-500" />
      </header>

      <form onSubmit={handleIssue} className="space-y-3" noValidate>
        <div>
          {fieldLabel('guest-name', 'Visitor name')}
          <input
            id="guest-name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            autoComplete="off"
            placeholder="Jordan Avery"
            className={inputClass}
          />
        </div>

        <div>
          {fieldLabel('guest-company', 'Company (optional)')}
          <input
            id="guest-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            autoComplete="off"
            placeholder="Acme Facilities"
            className={inputClass}
          />
        </div>

        <div>
          {fieldLabel('host-employee', 'Host employee')}
          <select
            id="host-employee"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            className={inputClass}
          >
            {TENANTS.map((tenant) => (
              <option key={tenant} value={tenant}>
                {tenant}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
            Vehicle plate
          </span>
          <LicensePlateInput value={plate} onChange={setPlate} />
        </div>

        <div>
          {fieldLabel('expected-arrival', 'Expected arrival')}
          <input
            id="expected-arrival"
            type="datetime-local"
            value={arrival}
            onChange={(e) => setArrival(e.target.value)}
            className={cn(inputClass, 'font-numeric')}
          />
          <p className="mt-1 text-xs text-slate-600">
            Future arrival pre-registers the visit — the host is notified automatically.
          </p>
        </div>

        <div>
          <span className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
            Pass duration
          </span>
          <TimePicker value={duration} onChange={setDuration} />
        </div>

        <div className="flex items-center justify-between rounded border border-slate-800 bg-control px-3 py-2 text-xs">
          <span className="text-slate-500">Visitor bays open</span>
          <Badge tone={openVisitorBays.length > 0 ? 'success' : 'critical'}>
            {openVisitorBays.length} / {visitorBays.length}
          </Badge>
        </div>

        <div>
          <label
            htmlFor="visitor-id-scan"
            className="mb-1 block text-xs uppercase tracking-wider text-slate-500"
          >
            Driver license scan (PDF/JPEG/PNG)
          </label>
          <input
            id="visitor-id-scan"
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              setIdScan(selected);
              setIdScanError(null);
            }}
            className="w-full text-xs text-slate-400 file:mr-3 file:rounded file:border-0 file:bg-control-overlay file:px-3 file:py-1.5 file:font-display file:text-xs file:uppercase file:tracking-widest file:text-slate-200 hover:file:bg-slate-600/40"
          />
          {idScanError && (
            <p role="alert" className="mt-1 text-xs text-status-occupied">
              {idScanError}
            </p>
          )}
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded border border-status-occupied/50 bg-status-occupied/10 px-3 py-2 text-sm text-status-occupied"
          >
            {formError}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full">
          Generate Pass &amp; Open Lane
        </Button>
      </form>
    </section>
  );
}
