import { Metadata } from 'next';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Reports',
  description: 'Occupancy, turnover, and dwell-time reporting with CSV export.',
};

const HOURLY_OCCUPANCY = [
  { hour: '05', pct: 14 },
  { hour: '06', pct: 31 },
  { hour: '07', pct: 58 },
  { hour: '08', pct: 82 },
  { hour: '09', pct: 93 },
  { hour: '10', pct: 96 },
  { hour: '11', pct: 91 },
  { hour: '12', pct: 88 },
  { hour: '13', pct: 90 },
  { hour: '14', pct: 84 },
  { hour: '15', pct: 71 },
  { hour: '16', pct: 55 },
  { hour: '17', pct: 38 },
  { hour: '18', pct: 22 },
];

const SUMMARY = [
  {
    label: 'Peak Occupancy',
    value: '96%',
    meta: '10:00 · L2 fully held',
    tone: 'critical' as const,
  },
  {
    label: 'Avg Dwell Time',
    value: '5h 40m',
    meta: 'Tenant permits excluded',
    tone: 'info' as const,
  },
  {
    label: 'Turnover',
    value: '3.2×',
    meta: 'Visitor bays, business day',
    tone: 'success' as const,
  },
  {
    label: 'Gate Events',
    value: '1,284',
    meta: 'Entries + exits, today',
    tone: 'neutral' as const,
  },
];

const toneClasses: Record<(typeof SUMMARY)[number]['tone'], string> = {
  critical: 'text-status-occupied',
  info: 'text-status-charging',
  success: 'text-status-available',
  neutral: 'text-slate-200',
};

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        subtitle="Occupancy, turnover, and dwell analytics for the operating day."
        actions={
          <>
            <Button variant="secondary" size="sm">
              Date Range
            </Button>
            <Button variant="primary" size="sm">
              Export CSV
            </Button>
          </>
        }
      />

      <section aria-label="Daily summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {SUMMARY.map((item) => (
          <div
            key={item.label}
            className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel"
          >
            <h2 className="font-display text-xs uppercase tracking-widest text-slate-400">
              {item.label}
            </h2>
            <p
              className={`font-numeric mt-1 font-display text-3xl font-semibold ${toneClasses[item.tone]}`}
            >
              {item.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{item.meta}</p>
          </div>
        ))}
      </section>

      <section
        aria-label="Occupancy by hour"
        className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel"
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm uppercase tracking-widest text-slate-400">
            Occupancy by Hour — Today
          </h2>
          <Badge tone="info">Static snapshot · report service pending</Badge>
        </header>

        <div
          className="flex h-48 items-end gap-1.5"
          role="img"
          aria-label="Bar chart of hourly occupancy from 05:00 to 18:00, peaking at 96 percent at 10:00"
        >
          {HOURLY_OCCUPANCY.map(({ hour, pct }) => (
            <div key={hour} className="group flex flex-1 flex-col items-center gap-1">
              <span className="font-numeric text-[10px] text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
                {pct}%
              </span>
              <div
                className={`w-full rounded-t transition-colors ${
                  pct > 90
                    ? 'bg-status-occupied/70'
                    : pct > 70
                      ? 'bg-status-reserved/70'
                      : 'bg-status-available/60'
                }`}
                style={{ height: `${pct}%` }}
              />
              <span className="font-numeric text-[10px] text-slate-500">{hour}</span>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-label="Scheduled reports"
        className="rounded border border-slate-700/70 bg-control-raised p-4 shadow-panel"
      >
        <h2 className="font-display text-sm uppercase tracking-widest text-slate-400">
          Scheduled Exports
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-center justify-between rounded border border-slate-800 bg-control px-3 py-2">
            <span className="text-slate-200">Daily occupancy digest → Building Operations</span>
            <Badge tone="success">06:00 daily</Badge>
          </li>
          <li className="flex items-center justify-between rounded border border-slate-800 bg-control px-3 py-2">
            <span className="text-slate-200">Visitor pass ledger → Tenant coordinators</span>
            <Badge tone="info">Weekly · Mon</Badge>
          </li>
          <li className="flex items-center justify-between rounded border border-slate-800 bg-control px-3 py-2">
            <span className="text-slate-200">EV energy consumption → Facilities billing</span>
            <Badge tone="warning">Monthly · 1st</Badge>
          </li>
        </ul>
      </section>
    </div>
  );
}
