'use client';

import * as React from 'react';

import type { DeviceStatus, HardwareDevice } from '@/lib/types';
import { useRealtime } from '@/lib/realtime';
import { rebootCommand } from '@/lib/seed';
import { cn, relativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconGate } from '@/components/ui/Icons';

const STATUS_TONE: Record<DeviceStatus, 'success' | 'warning' | 'critical' | 'info'> = {
  online: 'success',
  degraded: 'warning',
  offline: 'critical',
  maintenance: 'info',
};

/** Reboot command placeholder dialog — shows the exact CLI line before issue. */
function RebootDialog({ device, onClose }: { device: HardwareDevice; onClose: () => void }) {
  const { requestReboot } = useRealtime();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Reboot ${device.id}`}
    >
      <div className="absolute inset-0 bg-control-inset/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded border border-slate-700 bg-control-raised p-4 shadow-panel">
        <h2 className="font-display text-sm uppercase tracking-widest text-white">
          Reboot {device.id}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          The lane drops for the reboot window; ANPR reads queue until health checks pass.
        </p>
        <pre
          aria-label="Reboot command"
          className="mt-3 overflow-x-auto rounded border border-slate-800 bg-control-inset p-3 font-mono text-xs text-status-available"
        >
          {rebootCommand(device.id)}
        </pre>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              requestReboot(device.id);
              onClose();
            }}
          >
            Confirm Reboot
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeviceCard({ device }: { device: HardwareDevice }) {
  const [rebootOpen, setRebootOpen] = React.useState(false);
  const rebooting = device.rebootRequestedAt !== undefined;

  return (
    <article
      className={cn(
        'flex flex-col rounded border bg-control-raised p-4 shadow-panel',
        device.status === 'offline'
          ? 'border-status-occupied/50'
          : device.status === 'degraded'
            ? 'border-status-reserved/50'
            : 'border-slate-700/70',
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-widest text-white">
            <IconGate className="shrink-0 text-slate-500" />
            <span className="truncate">{device.id}</span>
          </h3>
          <p className="truncate text-xs text-slate-500">
            {device.name} · {device.location}
          </p>
        </div>
        <Badge tone={STATUS_TONE[device.status]} dot={device.status === 'online' || rebooting}>
          {rebooting ? 'rebooting' : device.status}
        </Badge>
      </header>

      <dl className="mt-3 flex-1 space-y-1 text-xs">
        <div className="flex justify-between">
          <dt className="text-slate-500">Firmware</dt>
          <dd className="font-numeric text-slate-300">{device.firmware}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Uptime (30d)</dt>
          <dd className="font-numeric text-slate-300">{device.uptimePct.toFixed(2)}%</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Last maintenance</dt>
          <dd className="font-numeric text-slate-400" suppressHydrationWarning>
            {relativeTime(device.lastMaintenanceAt)}
          </dd>
        </div>
        {device.note && <p className="pt-1 text-xs text-status-reserved">{device.note}</p>}
        {device.lastError && (
          <p className="pt-1 text-xs text-status-occupied">
            <span suppressHydrationWarning>{relativeTime(device.lastError.at)}: </span>
            {device.lastError.message}
          </p>
        )}
      </dl>

      <footer className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2">
        <span className="font-mono text-[10px] text-slate-600">{device.id}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRebootOpen(true)}
          disabled={rebooting}
        >
          Reboot…
        </Button>
      </footer>

      {rebootOpen && <RebootDialog device={device} onClose={() => setRebootOpen(false)} />}
    </article>
  );
}

export function HardwareBoard() {
  const { devices } = useRealtime();

  const online = devices.filter((d) => d.status === 'online').length;
  const degraded = devices.filter((d) => d.status === 'degraded').length;
  const down = devices.filter((d) => d.status === 'offline' || d.status === 'maintenance').length;
  const withErrors = devices.filter((d) => d.lastError).length;

  const errorLog = devices
    .filter((d) => d.lastError)
    .map((d) => ({ id: d.id, ...d.lastError! }))
    .sort((a, b) => b.at - a.at);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Online', value: online, tone: 'text-status-available' },
          { label: 'Degraded', value: degraded, tone: 'text-status-reserved' },
          { label: 'Down / Service', value: down, tone: 'text-status-occupied' },
          { label: 'Active Errors', value: withErrors, tone: 'text-slate-200' },
        ].map(({ label, value, tone }) => (
          <div
            key={label}
            className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel"
          >
            <h2 className="font-display text-xs uppercase tracking-widest text-slate-400">
              {label}
            </h2>
            <p className={cn('font-numeric mt-1 font-display text-3xl font-semibold', tone)}>
              {value}
              <span className="ml-1 text-sm text-slate-500">/ {devices.length}</span>
            </p>
          </div>
        ))}
      </div>

      <section aria-label="Device fleet" className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {devices.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </section>

      <section
        aria-label="Device error log"
        className="rounded border border-slate-700/70 bg-control-raised shadow-panel"
      >
        <header className="border-b border-slate-800 px-4 py-2.5">
          <h2 className="font-display text-sm uppercase tracking-widest text-slate-400">
            Error Log
          </h2>
        </header>
        <ol className="divide-y divide-slate-800/60">
          {errorLog.map((entry) => (
            <li key={entry.id + entry.at} className="flex items-start gap-3 px-4 py-2.5 text-sm">
              <span
                className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-status-occupied"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 text-slate-300">{entry.message}</span>
              <time
                dateTime={new Date(entry.at).toISOString()}
                suppressHydrationWarning
                className="font-numeric shrink-0 text-xs text-slate-500"
              >
                {relativeTime(entry.at)}
              </time>
            </li>
          ))}
          {errorLog.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-500">
              No active device errors — fleet nominal.
            </li>
          )}
        </ol>
      </section>
    </div>
  );
}
