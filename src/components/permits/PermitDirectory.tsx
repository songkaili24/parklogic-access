'use client';

import * as React from 'react';

import type { PermitType } from '@/lib/types';
import { PERMIT_TYPE_LABELS } from '@/lib/constants';
import { Badge } from '@/components/ui/Badge';
import { IconSearch } from '@/components/ui/Icons';

interface PermitHolder {
  name: string;
  unit: string;
  plate: string;
  vehicle: string;
  permit: PermitType;
  assignedBay: string;
  validThrough: string;
}

const HOLDERS: PermitHolder[] = [
  {
    name: 'Dana Whitfield',
    unit: 'Vertex Analytics · Fl 12',
    plate: '7KJH221',
    vehicle: 'Tesla Model Y',
    permit: 'executive',
    assignedBay: 'L3-G02',
    validThrough: '2027-03-31',
  },
  {
    name: 'Omar Haddad',
    unit: 'Vertex Analytics · Fl 12',
    plate: '4TRN890',
    vehicle: 'BMW 530e',
    permit: 'tenant',
    assignedBay: 'L2-D03',
    validThrough: '2026-12-31',
  },
  {
    name: 'Priya Raman',
    unit: 'Nimbus Health · Fl 14',
    plate: '9QWD113',
    vehicle: 'Rivian R1S',
    permit: 'tenant',
    assignedBay: 'L2-E08',
    validThrough: '2026-12-31',
  },
  {
    name: 'Cole Barrett',
    unit: 'Meridian facade crew',
    plate: 'HLM-2207',
    vehicle: 'Ford F-150',
    permit: 'contractor',
    assignedBay: 'L1-B09',
    validThrough: '2026-09-30',
  },
  {
    name: 'Ruth Okonkwo',
    unit: 'Delta Robotics · Fl 7',
    plate: '6ZPB554',
    vehicle: 'Audi e-tron',
    permit: 'tenant',
    assignedBay: 'L2-C11',
    validThrough: '2027-01-15',
  },
  {
    name: 'Felix Grant',
    unit: 'Building Operations',
    plate: '8RFQ731',
    vehicle: 'Chevy Bolt EUV',
    permit: 'valet',
    assignedBay: 'L1-A06',
    validThrough: '2026-11-30',
  },
  {
    name: 'Ines Duarte',
    unit: 'Kestrel Media · Fl 3',
    plate: 'KTW-8830',
    vehicle: 'Volvo XC40 Recharge',
    permit: 'tenant',
    assignedBay: 'L2-D14',
    validThrough: '2026-10-31',
  },
  {
    name: 'Hank Morrow',
    unit: 'Elevate Mechanical',
    plate: '3NVR412',
    vehicle: 'Ram ProMaster',
    permit: 'contractor',
    assignedBay: 'L1-B12',
    validThrough: '2026-09-18',
  },
  {
    name: 'Sofia Lindqvist',
    unit: 'Calloway & Roth LLP · Fl 9',
    plate: 'BJX-6640',
    vehicle: 'Polestar 2',
    permit: 'executive',
    assignedBay: 'L3-G05',
    validThrough: '2027-06-30',
  },
];

const PERMIT_FILTERS: Array<PermitType | 'all'> = [
  'all',
  'executive',
  'tenant',
  'contractor',
  'valet',
];

export function PermitDirectory() {
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<(typeof PERMIT_FILTERS)[number]>('all');

  const filtered = HOLDERS.filter((holder) => {
    const matchesFilter = filter === 'all' || holder.permit === filter;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      q.length === 0 ||
      holder.name.toLowerCase().includes(q) ||
      holder.plate.replace(/[-\s]/g, '').toLowerCase().includes(q.replace(/[-\s]/g, '')) ||
      holder.unit.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <label htmlFor="permit-search" className="sr-only">
            Search permit holders by name, plate, or tenant
          </label>
          <input
            id="permit-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, plate, or tenant…"
            className="h-9 w-64 rounded border border-slate-700 bg-control-inset pl-8 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-signal-green"
          />
        </div>

        <div role="radiogroup" aria-label="Filter by permit type" className="flex gap-1">
          {PERMIT_FILTERS.map((permit) => (
            <button
              key={permit}
              type="button"
              role="radio"
              aria-checked={filter === permit}
              onClick={() => setFilter(permit)}
              className={`rounded border px-2.5 py-1 font-display text-xs uppercase tracking-widest transition-colors ${
                filter === permit
                  ? 'border-signal-green bg-signal-green/15 text-signal-green'
                  : 'border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {permit === 'all' ? 'All' : PERMIT_TYPE_LABELS[permit]}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-slate-500">
          {filtered.length} of {HOLDERS.length} permits
        </span>
      </div>

      <div className="overflow-x-auto rounded border border-slate-700/70 bg-control-raised shadow-panel">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <caption className="sr-only">Permit holders with assigned bays and validity</caption>
          <thead>
            <tr className="border-b border-slate-800 font-display text-xs uppercase tracking-widest text-slate-500">
              <th scope="col" className="px-4 py-2.5">
                Holder
              </th>
              <th scope="col" className="px-4 py-2.5">
                Permit
              </th>
              <th scope="col" className="px-4 py-2.5">
                Plate
              </th>
              <th scope="col" className="px-4 py-2.5">
                Vehicle
              </th>
              <th scope="col" className="px-4 py-2.5">
                Assigned Bay
              </th>
              <th scope="col" className="px-4 py-2.5">
                Valid Through
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((holder) => (
              <tr
                key={holder.plate}
                className="border-b border-slate-800/60 last:border-0 hover:bg-control-overlay/50"
              >
                <td className="px-4 py-2.5">
                  <span className="font-medium text-slate-100">{holder.name}</span>
                  <span className="block text-xs text-slate-500">{holder.unit}</span>
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={holder.permit}>{PERMIT_TYPE_LABELS[holder.permit]}</Badge>
                </td>
                <td className="px-4 py-2.5 font-display tracking-wider text-slate-200">
                  {holder.plate}
                </td>
                <td className="px-4 py-2.5 text-slate-300">{holder.vehicle}</td>
                <td className="px-4 py-2.5 font-display tracking-wider text-signal-green">
                  {holder.assignedBay}
                </td>
                <td className="font-numeric px-4 py-2.5 text-slate-400">{holder.validThrough}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                  No permits match — adjust the search or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
