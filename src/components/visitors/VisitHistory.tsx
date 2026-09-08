'use client';

import type { VisitorVisit } from '@/lib/types';
import { formatClock, formatDuration } from '@/lib/utils';

export interface VisitHistoryProps {
  visits: VisitorVisit[];
  now: number;
  max?: number;
}

/** Check-in/check-out log for past visitor arrivals. */
export function VisitHistory({ visits, max = 10 }: VisitHistoryProps) {
  return (
    <section
      aria-label="Visitor history log"
      className="rounded border border-slate-700/70 bg-control-raised shadow-panel"
    >
      <header className="border-b border-slate-800 px-4 py-2.5">
        <h2 className="font-display text-sm uppercase tracking-widest text-slate-400">
          Visitor History
        </h2>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">Visitor check-in and check-out history</caption>
          <thead>
            <tr className="border-b border-slate-800 font-display text-xs uppercase tracking-widest text-slate-500">
              <th scope="col" className="px-4 py-2">Visitor</th>
              <th scope="col" className="px-4 py-2">Host</th>
              <th scope="col" className="px-4 py-2">Plate</th>
              <th scope="col" className="px-4 py-2">Check-in</th>
              <th scope="col" className="px-4 py-2">Check-out</th>
              <th scope="col" className="px-4 py-2">Dwell</th>
            </tr>
          </thead>
          <tbody>
            {visits.slice(0, max).map((visit) => (
              <tr key={visit.id} className="border-b border-slate-800/60 last:border-0">
                <td className="px-4 py-2">
                  <span className="text-slate-100">{visit.guestName}</span>
                  <span className="block text-xs text-slate-500">{visit.company ?? '—'}</span>
                </td>
                <td className="px-4 py-2 text-slate-400">{visit.host}</td>
                <td className="px-4 py-2 font-display tracking-wider text-slate-300">{visit.plate}</td>
                <td className="px-4 py-2 font-numeric text-slate-400">
                  <time dateTime={new Date(visit.checkIn).toISOString()} suppressHydrationWarning>
                    {formatClock(visit.checkIn)}
                  </time>
                </td>
                <td className="px-4 py-2 font-numeric text-slate-400">
                  <time dateTime={new Date(visit.checkOut ?? visit.checkIn).toISOString()} suppressHydrationWarning>
                    {visit.checkOut ? formatClock(visit.checkOut) : 'on site'}
                  </time>
                </td>
                <td className="px-4 py-2 font-numeric text-slate-400">
                  {visit.checkOut
                    ? formatDuration(Math.round((visit.checkOut - visit.checkIn) / 60_000))
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
