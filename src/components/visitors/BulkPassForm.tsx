'use client';

import * as React from 'react';

import { useRealtime } from '@/lib/realtime';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { TimePicker } from '@/components/ui/TimePicker';

const inputClass =
  'h-10 w-full rounded border border-slate-700 bg-control-inset px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-signal-green';

function fieldLabel(id: string, text: string) {
  return (
    <label htmlFor={id} className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
      {text}
    </label>
  );
}

export interface BulkPassFormProps {
  /** Fires with all generated pass codes, e.g. for batch printing. */
  onGenerated?: (codes: string[]) => void;
}

/** Bulk pass generation for events (2–20 scheduled passes). */
export function BulkPassForm({ onGenerated }: BulkPassFormProps) {
  const { issueBulkPasses } = useRealtime();
  const [eventName, setEventName] = React.useState('');
  const [bulkCount, setBulkCount] = React.useState(10);
  const [bulkDuration, setBulkDuration] = React.useState(240);

  const handleBulkIssue = (event: React.FormEvent) => {
    event.preventDefault();
    const name = eventName.trim();
    if (!name) return;
    const count = Math.min(20, Math.max(2, Math.round(bulkCount)));
    const created = issueBulkPasses(count, {
      guestName: name,
      host: 'Event Operations',
      validFrom: Date.now() + 30 * 60_000,
      validUntil: Date.now() + 30 * 60_000 + bulkDuration * 60_000,
    });
    onGenerated?.(created.map((pass) => pass.code));
  };

  return (
    <section
      aria-label="Bulk pass generation"
      className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel"
    >
      <h2 className="font-display text-sm uppercase tracking-widest text-slate-400">
        Bulk Passes — Events
      </h2>
      <form onSubmit={handleBulkIssue} className="mt-3 space-y-3">
        <div>
          {fieldLabel('bulk-event', 'Event name')}
          <input
            id="bulk-event"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Meridian Tenant Mixer"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            {fieldLabel('bulk-count', 'Passes (2–20)')}
            <input
              id="bulk-count"
              type="number"
              min={2}
              max={20}
              value={bulkCount}
              onChange={(e) => setBulkCount(Number(e.target.value))}
              className={cn(inputClass, 'font-numeric')}
            />
          </div>
          <div>
            <span className="mb-1 block text-xs uppercase tracking-wider text-slate-500">
              Duration
            </span>
            <TimePicker value={bulkDuration} onChange={setBulkDuration} maxMinutes={720} />
          </div>
        </div>
        <Button type="submit" variant="secondary" className="w-full">
          Generate {bulkCount} Event Passes
        </Button>
      </form>
    </section>
  );
}
