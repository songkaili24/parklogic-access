'use client';

import * as React from 'react';

import type { ChargingStation } from '@/lib/types';
import { useRealtime } from '@/lib/realtime';
import { formatClock } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconCheck } from '@/components/ui/Icons';

export function StationCard({ station }: { station: ChargingStation }) {
  const { sessions, reportStationFault } = useRealtime();
  const session = sessions.find((s) => s.stationId === station.id);
  const [faultOpen, setFaultOpen] = React.useState(false);
  const [faultSummary, setFaultSummary] = React.useState('');

  const statusTone =
    station.status === 'available'
      ? 'success'
      : station.status === 'charging'
        ? 'info'
        : station.status === 'fault'
          ? 'critical'
          : 'warning';

  return (
    <article className="flex flex-col rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-white">
            {station.id}
          </h3>
          <p className="text-xs text-slate-500">
            {station.chargerType} · {station.powerKw} kW
          </p>
        </div>
        <Badge tone={statusTone} dot={station.status !== 'fault'}>
          {station.status}
        </Badge>
      </header>

      <dl className="mt-3 flex-1 space-y-1 text-xs">
        <div className="flex justify-between">
          <dt className="text-slate-500">Energy today</dt>
          <dd className="font-numeric text-slate-200">{station.kwhToday.toFixed(1)} kWh</dd>
        </div>
        {session ? (
          <>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Session</dt>
              <dd className="truncate text-slate-200">
                {session.userName} ·{' '}
                <span className="font-display tracking-wider">{session.plate}</span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Delivered</dt>
              <dd className="font-numeric text-slate-200">
                {session.kwhDelivered} / {session.targetKwh} kWh
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Est. complete</dt>
              <dd className="font-numeric text-slate-400">
                ~{formatClock(session.startedAt + session.estMinutes * 60_000)}
              </dd>
            </div>
          </>
        ) : (
          station.note && <p className="text-xs text-status-occupied">{station.note}</p>
        )}
      </dl>

      {session && (
        <div
          role="meter"
          aria-valuenow={Math.round((session.kwhDelivered / session.targetKwh) * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Charging progress for ${station.id}`}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"
        >
          <div
            className="h-full rounded-full bg-status-charging transition-all duration-500"
            style={{ width: `${(session.kwhDelivered / session.targetKwh) * 100}%` }}
          />
        </div>
      )}

      <div className="mt-3 border-t border-slate-800 pt-2">
        {faultOpen ? (
          <form
            className="flex gap-1.5"
            onSubmit={(event) => {
              event.preventDefault();
              reportStationFault(station.id, faultSummary.trim() || 'Operator-reported fault');
              setFaultOpen(false);
              setFaultSummary('');
            }}
          >
            <input
              value={faultSummary}
              onChange={(e) => setFaultSummary(e.target.value)}
              placeholder="Fault description…"
              aria-label={`Fault description for ${station.id}`}
              className="h-8 flex-1 rounded border border-slate-700 bg-control-inset px-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-status-occupied"
            />
            <Button type="submit" variant="secondary" size="sm" className="px-2">
              Report
            </Button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setFaultOpen(true)}
            className="text-xs text-slate-500 transition-colors hover:text-status-occupied"
          >
            Report fault…
          </button>
        )}
      </div>
    </article>
  );
}

export function PricingPanel() {
  const { pricing, updatePricing } = useRealtime();
  const [draft, setDraft] = React.useState(pricing);

  React.useEffect(() => {
    setDraft(pricing);
  }, [pricing]);

  const numberField = (label: string, key: keyof typeof draft, step: number) => (
    <div>
      <label
        htmlFor={`pricing-${key}`}
        className="mb-1 block text-xs uppercase tracking-wider text-slate-500"
      >
        {label}
      </label>
      <input
        id={`pricing-${key}`}
        type="number"
        min={0}
        step={step}
        value={draft[key]}
        onChange={(e) => setDraft({ ...draft, [key]: Number(e.target.value) })}
        className="font-numeric h-9 w-full rounded border border-slate-700 bg-control-inset px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-signal-green"
      />
    </div>
  );

  return (
    <section
      aria-label="Pricing configuration"
      className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel"
    >
      <h2 className="font-display text-sm uppercase tracking-widest text-slate-400">
        Pricing Configuration
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {numberField('Level 2 $/kWh', 'l2PerKwh', 0.01)}
        {numberField('DC Fast $/kWh', 'dcfcPerKwh', 0.01)}
        {numberField('Session fee $', 'sessionFee', 0.25)}
        {numberField('Idle fee $/min', 'idlePerMin', 0.05)}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-slate-500">Applies to new sessions immediately.</p>
        <Button variant="secondary" size="sm" onClick={() => updatePricing(draft)}>
          <IconCheck /> Save
        </Button>
      </div>
    </section>
  );
}

