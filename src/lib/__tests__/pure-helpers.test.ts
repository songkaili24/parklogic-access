import { describe, expect, it, vi } from 'vitest';

import { permitStatus } from '@/lib/permits';
import { summarizeOccupancy } from '@/lib/occupancy';
import { generateUsageHistory } from '@/lib/usage';
import { downloadCsv, toCsv } from '@/lib/csv';
import { invoiceTotal, permitLineItem, rebootCommand } from '@/lib/seed';
import type { ParkingSpot } from '@/lib/types';

const spot = (id: string, status: ParkingSpot['status']): ParkingSpot => ({
  id,
  level: id.split('-')[0] ?? 'L1',
  zone: 'A',
  status,
  type: 'standard',
  updatedAt: 0,
});

describe('summarizeOccupancy', () => {
  it('returns zeroed summary with 0% rate for an empty garage', () => {
    expect(summarizeOccupancy([])).toEqual({
      total: 0,
      available: 0,
      occupied: 0,
      reserved: 0,
      charging: 0,
      offline: 0,
      occupancyRate: 0,
    });
  });

  it('excludes offline bays from the occupancy-rate denominator', () => {
    const summary = summarizeOccupancy([
      spot('L1-A01', 'occupied'),
      spot('L1-A02', 'available'),
      spot('L1-A03', 'offline'),
    ]);
    // 1 of 2 in-service bays → 50%, offline bay ignored.
    expect(summary.occupancyRate).toBe(50);
    expect(summary.total).toBe(3);
    expect(summary.offline).toBe(1);
  });

  it('counts charging bays separately from occupied', () => {
    const summary = summarizeOccupancy([spot('A', 'charging'), spot('B', 'charging'), spot('C', 'available')]);
    expect(summary.charging).toBe(2);
    expect(summary.occupied).toBe(0);
    expect(summary.occupancyRate).toBe(67); // 2/3 rounded
  });
});

describe('permitStatus', () => {
  const now = new Date(2026, 8, 8, 0, 30).getTime(); // Sep 8, just after local midnight

  it('marks permits past expiry as expired', () => {
    expect(permitStatus('2026-09-07', now)).toBe('expired');
  });

  it('treats expiry day itself as the last valid day', () => {
    expect(permitStatus('2026-09-08', now)).toBe('expiring');
  });

  it('flags permits inside the 30-day window as expiring', () => {
    expect(permitStatus('2026-10-07', now)).toBe('expiring');
  });

  it('keeps permits outside the window active', () => {
    expect(permitStatus('2026-10-08', now)).toBe('active');
    expect(permitStatus('2027-03-31', now)).toBe('active');
  });
});

describe('generateUsageHistory', () => {
  const now = new Date(2026, 8, 8, 12, 0).getTime(); // Tue Sep 8 2026, local noon

  it('returns exactly `days` ascending daily entries ending yesterday', () => {
    const history = generateUsageHistory('L1-A01', 30, now);
    expect(history).toHaveLength(30);
    expect(history[0]!.date).toBe('2026-08-09');
    expect(history.at(-1)!.date).toBe('2026-09-07');
    for (let i = 1; i < history.length; i++) {
      expect(history[i]!.date > history[i - 1]!.date).toBe(true);
    }
  });

  it('is deterministic for the same bay id (same panel on every render)', () => {
    expect(generateUsageHistory('L2-C07', 30, now)).toEqual(generateUsageHistory('L2-C07', 30, now));
  });

  it('produces distinct histories for different bays', () => {
    expect(generateUsageHistory('L1-A01', 30, now)).not.toEqual(generateUsageHistory('L2-C07', 30, now));
  });

  it('keeps weekday occupancy busy and weekend occupancy quiet', () => {
    const history = generateUsageHistory('L1-B01', 30, now);
    for (const day of history) {
      const weekday = new Date(`${day.date}T12:00:00`).getDay();
      const isWeekend = weekday === 0 || weekday === 6;
      if (isWeekend) {
        expect(day.occupancyPct).toBeLessThanOrEqual(25);
      } else {
        expect(day.occupancyPct).toBeGreaterThanOrEqual(60);
      }
      expect(day.gateEvents).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('csv', () => {
  it('escapes commas, quotes, and newlines per RFC 4180', () => {
    const csv = toCsv(['a', 'b'], [['plain', 'has,comma'], ['has"quote', 'has\nnewline']]);
    expect(csv.split('\r\n')).toEqual([
      'a,b',
      'plain,"has,comma"',
      '"has""quote","has\nnewline"',
    ]);
  });

  it('serializes undefined cells as empty', () => {
    expect(toCsv(['a', 'b'], [[undefined, 5]])).toBe('a,b\r\n,5');
  });

  it('downloadCsv triggers a blob download and cleans up the anchor', () => {
    const createObjectURL = vi.fn(() => 'blob:mock');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const appendSpy = vi.spyOn(document.body, 'appendChild');

    downloadCsv('receipt.csv', ['a'], [[1]]);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(appendSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    clickSpy.mockRestore();

    appendSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});

describe('billing + hardware helpers', () => {
  it('prices unknown permit categories at the monthly rate', () => {
    expect(permitLineItem('monthly', '2026-09').amountCents).toBe(185_00);
    expect(permitLineItem('nonexistent-tier', '2026-09').amountCents).toBe(185_00);
    expect(permitLineItem('executive', '2026-09').description).toBe('Executive permit — 2026-09');
  });

  it('sums invoice line items', () => {
    expect(
      invoiceTotal({
        id: 'X',
        holderId: 'H',
        holderName: 'N',
        holderCompany: 'C',
        period: '2026-09',
        lineItems: [
          { description: 'a', amountCents: 185_00 },
          { description: 'b', amountCents: 15_00 },
        ],
        status: 'sent',
        issuedAt: 0,
        dueAt: 0,
      }),
    ).toBe(200_00);
  });

  it('formats the reboot command with the device id', () => {
    expect(rebootCommand('GW-P1-01')).toBe('plctl device reboot --id GW-P1-01 --wait-health 30s');
  });
});
