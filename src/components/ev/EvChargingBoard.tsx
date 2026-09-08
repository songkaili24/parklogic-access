'use client';

import * as React from 'react';

import type { ChargingStation } from '@/lib/types';
import { useRealtime } from '@/lib/realtime';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconBolt } from '@/components/ui/Icons';

const STATIONS: ChargingStation[] = [
  {
    id: 'EV-L3-F01',
    level: 'L3',
    zone: 'F',
    network: 'DC Fast Charge',
    powerKw: 150,
    ports: 2,
    portsInUse: 1,
    status: 'online',
    loadShed: false,
  },
  {
    id: 'EV-L3-F04',
    level: 'L3',
    zone: 'F',
    network: 'AC Level 2',
    powerKw: 11,
    ports: 4,
    portsInUse: 3,
    status: 'online',
    loadShed: true,
  },
  {
    id: 'EV-L1-F02',
    level: 'L1',
    zone: 'F',
    network: 'AC Level 2',
    powerKw: 11,
    ports: 4,
    portsInUse: 2,
    status: 'online',
    loadShed: false,
  },
  {
    id: 'EV-L1-F05',
    level: 'L1',
    zone: 'F',
    network: 'AC Level 2',
    powerKw: 7.2,
    ports: 2,
    portsInUse: 0,
    status: 'degraded',
    loadShed: false,
  },
  {
    id: 'EV-L2-F01',
    level: 'L2',
    zone: 'F',
    network: 'AC Level 2',
    powerKw: 11,
    ports: 4,
    portsInUse: 4,
    status: 'online',
    loadShed: true,
  },
  {
    id: 'EV-L2-F06',
    level: 'L2',
    zone: 'F',
    network: 'DC Fast Charge',
    powerKw: 50,
    ports: 1,
    portsInUse: 0,
    status: 'offline',
    loadShed: false,
  },
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
            {station.network} · {station.powerKw} kW · Level {station.level.replace('L', '')}
          </p>
        </div>
        <Badge
          tone={
            station.status === 'online'
              ? 'success'
              : station.status === 'degraded'
                ? 'warning'
                : 'offline'
          }
          dot={station.status === 'online'}
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
        {station.loadShed ? (
          <Badge tone="warning">Load shed 7.2 kW cap</Badge>
        ) : (
          <Badge tone="neutral">Full power</Badge>
        )}
        <Button variant="outline" size="sm" disabled={station.status === 'offline'}>
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
    (sum, s) => sum + (s.status !== 'offline' ? s.portsInUse * s.powerKw : 0),
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
              {STATIONS.filter((s) => s.loadShed && s.status !== 'offline').length}
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
              {STATIONS.filter((s) => s.status === 'offline').reduce((sum, s) => sum + s.ports, 0)}
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
