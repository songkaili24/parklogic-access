'use client';

import * as React from 'react';

import type { VisitorPass } from '@/lib/types';
import { TENANTS } from '@/lib/constants';
import { useRealtime } from '@/lib/realtime';
import { validatePlate } from '@/lib/validation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LicensePlateInput } from '@/components/ui/LicensePlateInput';
import { TimePicker } from '@/components/ui/TimePicker';
import { VisitorPassCard } from '@/components/ui/VisitorPassCard';
import { IconQr } from '@/components/ui/Icons';

/** Passes already in the system when the shift opens. */
function seededPasses(): VisitorPass[] {
  const now = Date.now();
  return [
    {
      code: 'PL-K4TZ-9MQ2',
      guestName: 'Sarah Chen',
      host: 'Nimbus Health (Fl 14)',
      plate: 'GDX-4451',
      level: 'L1',
      spot: 'A02',
      validFrom: now - 45 * 60_000,
      validUntil: now + 3 * 3_600_000,
      status: 'active',
    },
    {
      code: 'PL-VB7X-2HD8',
      guestName: 'Marcus Webb',
      host: 'Vertex Analytics (Fl 12)',
      plate: 'MDS-1902',
      level: 'L1',
      spot: 'A04',
      validFrom: now - 20 * 60_000,
      validUntil: now + 90 * 60_000,
      status: 'active',
    },
    {
      code: 'PL-JN3P-6WR5',
      guestName: 'Elena Ortiz',
      host: 'Calloway & Roth LLP (Fl 9)',
      plate: '6ZPB554',
      level: 'L1',
      spot: 'A01',
      validFrom: now - 26 * 3_600_000,
      validUntil: now - 2 * 3_600_000,
      status: 'expired',
    },
  ];
}

export function VisitorManagement() {
  const { issuePass, passes, spots, now } = useRealtime();

  const [guestName, setGuestName] = React.useState('');
  const [host, setHostTenant] = React.useState<string>(TENANTS[0]);
  const [plate, setPlate] = React.useState('');
  const [duration, setDuration] = React.useState(120);
  const [formError, setFormError] = React.useState<string | null>(null);

  const seeded = React.useMemo(seededPasses, []);
  const allPasses = React.useMemo(() => [...passes, ...seeded], [passes, seeded]);

  const visitorBays = React.useMemo(() => spots.filter((s) => s.type === 'visitor'), [spots]);
  const openVisitorBays = visitorBays.filter((s) => s.status === 'available');

  const handleIssue = (event: React.FormEvent) => {
    event.preventDefault();
    const plateCheck = validatePlate(plate);
    if (!guestName.trim()) {
      setFormError('Guest name is required for gate ANPR matching.');
      return;
    }
    if (!plateCheck.valid) {
      setFormError(plateCheck.error ?? 'Plate failed validation.');
      return;
    }
    const target = openVisitorBays[0];
    if (!target) {
      setFormError('No open visitor bays — release a held bay or use valet lane.');
      return;
    }

    issuePass({
      guestName: guestName.trim(),
      host,
      validFrom: Date.now(),
      plate: plateCheck.normalized,
      level: target.level,
      spot: target.id.split('-')[1] ?? target.id,
      validUntil: now + duration * 60_000,
    });

    setGuestName('');
    setPlate('');
    setFormError(null);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
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

        <form onSubmit={handleIssue} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="guest-name"
              className="mb-1 block text-xs uppercase tracking-wider text-slate-500"
            >
              Guest name
            </label>
            <input
              id="guest-name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              autoComplete="off"
              placeholder="Jordan Avery"
              className="h-10 w-full rounded border border-slate-700 bg-control-inset px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-signal-green"
            />
          </div>

          <div>
            <label
              htmlFor="host-tenant"
              className="mb-1 block text-xs uppercase tracking-wider text-slate-500"
            >
              Host tenant
            </label>
            <select
              id="host-tenant"
              value={host}
              onChange={(e) => setHostTenant(e.target.value)}
              className="h-10 w-full rounded border border-slate-700 bg-control-inset px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-signal-green"
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
            <span className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
              Reservation window
            </span>
            <TimePicker value={duration} onChange={setDuration} />
          </div>

          <div className="flex items-center justify-between rounded border border-slate-800 bg-control px-3 py-2 text-xs">
            <span className="text-slate-500">Visitor bays open</span>
            <Badge tone={openVisitorBays.length > 0 ? 'success' : 'critical'}>
              {openVisitorBays.length} / {visitorBays.length}
            </Badge>
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

      <section aria-label="Active visitor passes" className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="font-display text-sm uppercase tracking-widest text-slate-400">
            Visitor Passes ({allPasses.filter((p) => p.validUntil > now).length} active)
          </h2>
          <span className="text-xs text-slate-500">QR payload scans at P1 visitor lane</span>
        </header>

        <div className="grid gap-3 xl:grid-cols-2">
          {allPasses.slice(0, 6).map((pass) => (
            <VisitorPassCard key={pass.code} pass={pass} now={now} />
          ))}
        </div>
      </section>
    </div>
  );
}
