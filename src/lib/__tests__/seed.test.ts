import { describe, expect, it } from 'vitest';

import {
  generateGateEvents,
  generateInvoices,
  generatePermitHolders,
  generateSessions,
  generateSpots,
  generateStations,
  generateTickets,
  generateVisitHistory,
  generateVisitorPasses,
  generateViolations,
  generateWaitlist,
  invoiceTotal,
} from '@/lib/seed';
import { LEVELS, LEVEL_NAMES, ZONES, zoneSize } from '@/lib/seed/core';

describe('garage structure integrity', () => {
  const holders = generatePermitHolders();
  const spots = generateSpots(holders);

  it('builds exactly 120 bays across three levels', () => {
    expect(spots).toHaveLength(120);
    const byLevel = Object.groupBy(spots, (s) => s.level);
    expect(byLevel.L1).toHaveLength(44); // A12 + B16 + C16
    expect(byLevel.L2).toHaveLength(42); // C14 + D14 + E14
    expect(byLevel.L3).toHaveLength(34); // F8 + G10 + H16
  });

  it('keeps zone sizes consistent with the declared geography', () => {
    for (const level of LEVELS) {
      const zones = ZONES[level];
      const total = zones.reduce((sum, zone) => sum + zoneSize(level, zone), 0);
      expect(total).toBe(spots.filter((s) => s.level === level).length);
    }
  });

  it('exposes a display name for every level', () => {
    for (const level of LEVELS) expect(LEVEL_NAMES[level]).toBeTruthy();
  });

  it('lands business-hour occupancy near the 65% spec', () => {
    const occupied = spots.filter((s) => s.status === 'occupied' || s.status === 'charging').length;
    const rate = occupied / spots.length;
    expect(rate).toBeGreaterThan(0.55);
    expect(rate).toBeLessThan(0.75);
  });

  it('takes the five visitor-held bays out of general circulation', () => {
    for (const bay of ['L1-A01', 'L1-A02', 'L1-A03', 'L1-A04', 'L1-A05']) {
      expect(spots.find((s) => s.id === bay)?.status).toBe('reserved');
    }
  });

  it('applies the declared EV bank statuses to the L3-F bays in order', () => {
    const evBays = spots.filter((s) => s.type === 'ev').sort((a, b) => a.id.localeCompare(b.id));
    expect(evBays).toHaveLength(8);
    expect(evBays.filter((s) => s.status === 'charging')).toHaveLength(3);
    expect(evBays.find((s) => s.id === 'L3-F08')?.status).toBe('offline');
  });

  it('links permit holders to their assigned bays both ways', () => {
    for (const holder of holders.filter((h) => h.assignedBay)) {
      const bay = spots.find((s) => s.id === holder.assignedBay);
      expect(bay?.holderId).toBe(holder.id);
      if (bay?.status === 'occupied') {
        expect(bay.plate).toBe(holder.plate);
      } else {
        expect(bay?.status).toBe('reserved');
      }
    }
  });

  it('leaves at most three bays offline for the sensor sweep', () => {
    // 3 sensor-sweep bays + the faulted EV bank L3-F08.
    expect(spots.filter((s) => s.status === 'offline')).toHaveLength(4);
  });
});

describe('permit holders', () => {
  const holders = generatePermitHolders();

  it('seeds exactly 20 holders with unique ids and plates', () => {
    expect(holders).toHaveLength(20);
    expect(new Set(holders.map((h) => h.id)).size).toBe(20);
    expect(new Set(holders.map((h) => h.plate)).size).toBe(20);
  });

  it('stays inside the commercial permit taxonomy', () => {
    const allowed = new Set(['monthly', 'annual', 'executive', 'overflow', 'contractor', 'valet']);
    for (const holder of holders) expect(allowed.has(holder.permitType)).toBe(true);
  });
});

describe('gate event stream', () => {
  const events = generateGateEvents();

  it('seeds exactly 50 ANPR reads, newest first', () => {
    expect(events).toHaveLength(50);
    for (let i = 1; i < events.length; i++) {
      expect(events[i]!.timestamp).toBeLessThanOrEqual(events[i - 1]!.timestamp);
    }
  });

  it('carries a violation kind on every denial', () => {
    for (const event of events.filter((e) => e.eventType === 'denied')) {
      expect(event.violation).toBeTruthy();
      expect(event.result).toBe('denied');
    }
  });

  it('never grants a denied event', () => {
    expect(events.every((e) => e.result !== 'denied' || e.eventType === 'denied')).toBe(true);
  });
});

describe('EV network seeds', () => {
  const stations = generateStations();

  it('seeds 8 stations with session seeds only on charging banks', () => {
    expect(stations).toHaveLength(8);
    const sessions = generateSessions(stations);
    expect(sessions).toHaveLength(stations.filter((s) => s.status === 'charging').length);
    for (const session of sessions) {
      const station = stations.find((s) => s.id === session.stationId);
      expect(station?.portsInUse).toBeGreaterThan(0);
      expect(session.targetKwh).toBeGreaterThan(session.kwhDelivered);
    }
  });

  it('keeps the faulted station matched by an open ticket', () => {
    const tickets = generateTickets();
    for (const ticket of tickets.filter((t) => t.status === 'open')) {
      const station = stations.find((s) => s.id === ticket.stationId);
      expect(station?.status).toBe('fault');
    }
  });
});

describe('violations, billing, visitors, and waitlist seeds', () => {
  it('spans every violation status with ANPR evidence on each citation', () => {
    const violations = generateViolations();
    expect(violations).toHaveLength(8);
    const statuses = new Set(violations.map((v) => v.status));
    expect(statuses).toEqual(new Set(['open', 'contested', 'upheld', 'dismissed', 'paid']));
    for (const violation of violations) {
      expect(violation.evidenceRef).toMatch(/^ANPR-\d{4}$/);
      expect(violation.fineCents).toBeGreaterThan(0);
    }
  });

  it('resolves contested citations only through a filed appeal', () => {
    const violations = generateViolations();
    for (const violation of violations.filter((v) => v.status === 'contested')) {
      expect(violation.appeal?.status).toBe('pending');
    }
    for (const violation of violations.filter((v) => v.status === 'upheld')) {
      expect(violation.appeal?.status).toBe('denied');
    }
    for (const violation of violations.filter((v) => v.status === 'dismissed')) {
      expect(violation.appeal?.status).toBe('approved');
    }
  });

  it('seeds invoices in every payment state with consistent totals', () => {
    const invoices = generateInvoices();
    expect(invoices).toHaveLength(9);
    for (const invoice of invoices) {
      expect(invoiceTotal(invoice)).toBeGreaterThan(0);
      expect(invoice.dueAt).toBeGreaterThan(invoice.issuedAt);
      if (invoice.status === 'paid') expect(invoice.paidAt).toBeDefined();
      if (invoice.status === 'overdue') expect(invoice.dueAt).toBeLessThan(Date.now());
    }
  });

  it('seeds 5 visitor passes (3 active, 2 scheduled) with ordered windows', () => {
    const passes = generateVisitorPasses();
    expect(passes).toHaveLength(5);
    expect(passes.filter((p) => p.status === 'active')).toHaveLength(3);
    expect(passes.filter((p) => p.status === 'scheduled')).toHaveLength(2);
    for (const pass of passes) {
      expect(pass.validFrom).toBeLessThan(pass.validUntil);
      expect(pass.level).toBe('L1');
    }
  });

  it('seeds the visit history and permit waitlist', () => {
    expect(generateVisitHistory().every((v) => (v.checkOut ?? 0) >= v.checkIn)).toBe(true);
    const waitlist = generateWaitlist();
    expect(waitlist).toHaveLength(4);
    expect(waitlist.every((entry) => entry.position >= 1)).toBe(true);
  });
});
