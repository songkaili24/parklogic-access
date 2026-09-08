'use client';

import * as React from 'react';

import type { ChargingStation } from '@/lib/types';
import { useRealtime } from '@/lib/realtime';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconBolt } from '@/components/ui/Icons';

const STATIONS: ChargingStation[] = [
  { id: 'EV-L3-F01', level: 'L3', zone: 'F', chargerType: 'DC Fast Charge', powerKw: 150, ports: 1, portsInUse: 1, status: 'charging', kwhToday: 84.2 },
  { id: 'EV-L3-F02', level: 'L3', zone: 'F', chargerType: 'DC Fast Charge', powerKw: 150, ports: 1, portsInUse: 1, status: 'charging', kwhToday: 61.7 },
  { id: 'EV-L3-F03', level: 'L3', zone: 'F', chargerType: 'Level 2', powerKw: 11, ports: 1, portsInUse: 1, status: 'charging', kwhToday: 18.4 },
  { id: 'EV-L3-F04', level: 'L3', zone: 'F', chargerType: 'Level 2', powerKw: 11, ports: 1, portsInUse: 0, status: 'available', kwhToday: 9.1 },
  { id: 'EV-L3-F05', level: 'L3', zone: 'F', chargerType: 'Level 2', powerKw: 11, ports: 1, portsInUse: 0, status: 'available', kwhToday: 12.6 },
  { id: 'EV-L3-F08', level: 'L3', zone: 'F', chargerType: 'Level 2', powerKw: 11, ports: 1, portsInUse: 0, status: 'fault', kwhToday: 0, note: 'Connector latch jam' },
];

function StationCard({ station }: { station: ChargingStation }) {
  const utilization = Math.round((station.portsInUse / station.ports) * 100);

  return (
    <article className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-white">
            {station.id}
          </h3>
          <p className="text-xs text-slate-500">
            {station.chargerType} · {station.powerKw} kW · Level {station.level.replace('L', '')}
          </p>
        </div>
        <Badge
          tone={
            station.status === 'available'
              ? 'success'
              : station.status === 'charging'
                ? 'info'
                : station.status === 'reserved'
                  ? 'warning'
                  : 'critical'
          }
          dot={station.status === 'charging'}
        >
          {station.status}
        </Badge>
      </header>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Ports in use</span>
          <span className="font-numeric">
            {station.portsInUse}/{station.ports}
          </span>
        </div>
        <div
          role="meter"
          aria-valuenow={utilization}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${station.id} port utilization`}
          className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              utilization === 100 ? 'bg-status-reserved' : 'bg-status-charging'
            }`}
            style={{ width: `${utilization}%` }}
          />
        </div>
      </div>

      <footer className="mt-3 flex items-center justify-between">
        <Badge tone="neutral">{station.kwhToday.toFixed(1)} kWh today</Badge>
        <Button variant="outline" size="sm" disabled={station.status === 'fault'}>
          Sessions
        </Button>
      </footer>
    </article>
  );
}

export function EvChargingBoard() {
  const { spots } = useRealtime();
  const evBays = React.useMemo(() => spots.filter((s) => s.type === 'ev'), [spots]);
  const activeSessions = evBays.filter((s) => s.status === 'charging').length;
  const totalLoad = STATIONS.reduce(
    (sum, s) => sum + (s.status !== 'fault' ? s.portsInUse * s.powerKw : 0),
    0,
  ).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel">
          <h3 className="font-display text-xs uppercase tracking-widest text-slate-400">
            Active Sessions
          </h3>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="font-numeric font-display text-3xl font-semibold text-status-charging">
              {activeSessions}
            </span>
            <span className="inline-flex items-center text-sm text-slate-400">
              <IconBolt className="animate-pulse-dot text-status-charging" />
            </span>
          </p>
        </div>
        <div className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel">
          <h3 className="font-display text-xs uppercase tracking-widest text-slate-400">
            Live Load
          </h3>
          <p className="mt-1">
            <span className="font-numeric font-display text-3xl font-semibold text-white">
              {totalLoad}
            </span>
            <span className="text-sm text-slate-400"> kW</span>
          </p>
        </div>
        <div className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel">
          <h3 className="font-display text-xs uppercase tracking-widest text-slate-400">
            Banks Load-Shedding
          </h3>
          <p className="mt-1">
            <span className="font-numeric font-display text-3xl font-semibold text-status-reserved">
              {STATIONS.filter((s) => s.status === 'reserved' || s.note !== undefined).length}
            </span>
            <span className="text-sm text-slate-400"> / {STATIONS.length}</span>
          </p>
        </div>
        <div className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel">
          <h3 className="font-display text-xs uppercase tracking-widest text-slate-400">
            Ports Offline
          </h3>
          <p className="mt-1">
            <span className="font-numeric font-display text-3xl font-semibold text-slate-300">
              {STATIONS.filter((s) => s.status === 'fault').reduce((sum, s) => sum + s.ports, 0)}
            </span>
          </p>
        </div>
      </div>

      <section aria-label="Charging stations" className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {STATIONS.map((station) => (
          <StationCard key={station.id} station={station} />
        ))}
      </section>

      <section
        aria-label="EV bay status"
        className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel"
      >
        <h2 className="font-display text-sm uppercase tracking-widest text-slate-400">
          EV Bay Status (live)
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {evBays.map((bay) => (
            <li key={bay.id}>
              <Badge tone={bay.status} dot={bay.status === 'charging'}>
                {bay.id}
              </Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
