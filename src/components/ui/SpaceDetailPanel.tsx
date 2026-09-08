'use client';

import * as React from 'react';

import type { ParkingSpot, PermitHolder } from '@/lib/types';
import { PERMIT_TYPE_LABELS, VEHICLE_CLASS_LABELS } from '@/lib/constants';
import { permitStatus } from '@/lib/permits';
import { generateUsageHistory } from '@/lib/usage';
import { cn, formatClock } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconAlertTriangle, IconCheck, IconX } from '@/components/ui/Icons';

export interface SpaceDetailPanelProps {
  spot: ParkingSpot;
  holder?: PermitHolder;
  now: number;
  onClose: () => void;
  onAssignPermit: (spotId: string) => void;
  onMarkAvailable: (spotId: string) => void;
  onReportIssue: (spotId: string) => void;
  className?: string;
}

function UsageSparkline({ spotId }: { spotId: string }) {
  const history = React.useMemo(() => generateUsageHistory(spotId, 30), [spotId]);
  const max = 100;

  return (
    <div>
      <div
        className="flex h-14 items-end gap-px"
        role="img"
        aria-label={`Daily occupancy for bay ${spotId} over the last 30 days, averaging ${Math.round(history.reduce((s, d) => s + d.occupancyPct, 0) / history.length)} percent`}
      >
        {history.map((day) => (
          <div
            key={day.date}
            title={`${day.date}: ${day.occupancyPct}% · ${day.gateEvents} gate events`}
            className={cn(
              'flex-1 rounded-t-sm',
              day.occupancyPct > 80
                ? 'bg-status-occupied/70'
                : day.occupancyPct > 50
                  ? 'bg-status-reserved/70'
                  : 'bg-status-available/60',
            )}
            style={{ height: `${Math.max(4, (day.occupancyPct / max) * 100)}%` }}
          />
        ))}
      </div>
      <p className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>30 days ago</span>
        <span>daily occupancy %</span>
        <span>yesterday</span>
      </p>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="truncate text-right text-slate-200">{children}</dd>
    </div>
  );
}

/**
 * Space detail side panel: identity, live status, permit holder, current
 * occupancy, operator actions, and 30-day usage history.
 */
export function SpaceDetailPanel({
  spot,
  holder,
  now,
  onClose,
  onAssignPermit,
  onMarkAvailable,
  onReportIssue,
  className,
}: SpaceDetailPanelProps) {
  const history = React.useMemo(() => generateUsageHistory(spot.id, 30, now), [spot.id, now]);
  const utilization = Math.round(history.reduce((s, d) => s + d.occupancyPct, 0) / history.length);
  const holderStatus = holder ? permitStatus(holder.validThrough, now) : undefined;

  return (
    <aside
      role="complementary"
      aria-label={`Bay ${spot.id} detail`}
      className={cn(
        'flex h-full flex-col overflow-hidden rounded border border-slate-700/70 bg-control-raised shadow-panel',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-2 border-b border-slate-800 px-4 py-3">
        <div>
          <h2 className="font-display text-base font-semibold uppercase tracking-widest text-white">
            Bay {spot.id}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Level {spot.level.replace('L', '')} · Row {spot.zone} · #{Number(spot.id.slice(-2))}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close bay detail"
          onClick={onClose}
          className="rounded p-1 text-slate-500 transition-colors hover:text-slate-200"
        >
          <IconX />
        </button>
      </header>

      <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Badge tone={spot.status} dot={spot.status === 'charging'}>
            {spot.status}
          </Badge>
          <span className="text-xs text-slate-500">
            since{' '}
            <time dateTime={new Date(spot.updatedAt).toISOString()} suppressHydrationWarning>
              {formatClock(spot.updatedAt)}
            </time>
          </span>
        </div>

        {spot.status === 'occupied' && spot.occupiedSince && (
          <dl className="space-y-1.5">
            <DetailRow label="Vehicle plate">
              <span className="font-display tracking-wider">{spot.plate}</span>
            </DetailRow>
            <DetailRow label="Arrived">
              <span className="font-numeric">{formatClock(spot.occupiedSince)}</span>
            </DetailRow>
            <DetailRow label="Dwell">
              <span className="font-numeric">
                {Math.floor((now - spot.occupiedSince) / 3_600_000)}h{' '}
                {Math.floor(((now - spot.occupiedSince) % 3_600_000) / 60_000)}m
              </span>
            </DetailRow>
            <DetailRow label="Departure">
              <span className="text-slate-500">on gate read at exit</span>
            </DetailRow>
          </dl>
        )}

        {holder ? (
          <section
            aria-label="Assigned permit holder"
            className="rounded border border-slate-800 bg-control p-3"
          >
            <header className="flex items-center justify-between gap-2">
              <h3 className="font-display text-xs uppercase tracking-widest text-slate-400">
                Permit Holder
              </h3>
              <Badge tone={holder.permitType}>{PERMIT_TYPE_LABELS[holder.permitType]}</Badge>
            </header>
            <p className="mt-2 text-sm font-medium text-slate-100">{holder.name}</p>
            <p className="text-xs text-slate-500">{holder.company}</p>
            <dl className="mt-2 space-y-1.5">
              <DetailRow label="Vehicle">
                {holder.vehicle} · {VEHICLE_CLASS_LABELS[holder.vehicleClass]}
              </DetailRow>
              <DetailRow label="Plate">
                <span className="font-display tracking-wider">{holder.plate}</span>
              </DetailRow>
              <DetailRow label="Permit valid through">
                <span
                  className={cn(
                    holderStatus === 'expired'
                      ? 'text-status-occupied'
                      : holderStatus === 'expiring'
                        ? 'text-status-reserved'
                        : 'text-slate-200',
                  )}
                >
                  {holder.validThrough}
                  {holderStatus !== 'active' && ` (${holderStatus})`}
                </span>
              </DetailRow>
            </dl>
          </section>
        ) : (
          <p className="rounded border border-dashed border-slate-700 px-3 py-2 text-xs text-slate-500">
            {spot.status === 'reserved'
              ? 'Bay on administrative hold — no permit linked.'
              : 'No permit assigned — transient or overflow parking.'}
          </p>
        )}

        <section aria-label="Operator actions" className="grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm" onClick={() => onAssignPermit(spot.id)}>
            Assign Permit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onMarkAvailable(spot.id)}
            disabled={spot.status === 'available'}
          >
            <IconCheck /> Mark Available
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="col-span-2 border-status-reserved/50 text-status-reserved hover:border-status-reserved hover:text-status-reserved"
            onClick={() => onReportIssue(spot.id)}
            disabled={spot.status === 'offline'}
          >
            <IconAlertTriangle /> Report Issue / Hold Bay
          </Button>
        </section>

        <section aria-label="Usage history">
          <h3 className="mb-2 flex items-baseline justify-between font-display text-xs uppercase tracking-widest text-slate-400">
            30-Day Usage
            <span className="font-numeric text-slate-500">avg {utilization}%</span>
          </h3>
          <UsageSparkline spotId={spot.id} />
        </section>
      </div>
    </aside>
  );
}
