import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';

import { providerTimers, mountWithProbe, advanceTicks, type Mutable } from './provider-harness';

describe('hardware lifecycle', () => {
  beforeEach(() => providerTimers.beforeEach());
  afterEach(() => providerTimers.afterEach());

  it('requestReboot marks the device and it recovers online after the health window', async () => {
    const { states } = mountWithProbe();
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    const state = states.at(-1)!;
    const device = state.devices.find((d) => d.status === 'degraded')!;

    await act(async () => { state.requestReboot(device.id); });
    const rebooting = states.at(-1)!.devices.find((d) => d.id === device.id)!;
    expect(rebooting.rebootRequestedAt).toBeDefined();
    expect(rebooting.status).toBe('maintenance');

    // Recovery effect checks at ~21s; the sim tick must also run.
    await advanceTicks(6);
    const recovered = states.at(-1)!.devices.find((d) => d.id === device.id)!;
    expect(recovered.status).toBe('online');
    expect(recovered.rebootRequestedAt).toBeUndefined();
    expect(recovered.lastError).toBeUndefined();
  });

  it('acknowledgeDeviceError clears the last error without touching status', async () => {
    const { states } = mountWithProbe();
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    const state = states.at(-1)!;
    const device = state.devices.find((d) => d.lastError)!;

    await act(async () => { state.acknowledgeDeviceError(device.id); });
    const after = states.at(-1)!.devices.find((d) => d.id === device.id)!;
    expect(after.lastError).toBeUndefined();
    expect(after.status).toBe(device.status);
  });

  it('resolveTicket returns the faulted charger to service', async () => {
    const { states } = mountWithProbe();
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    const state = states.at(-1)!;
    const openTicket = state.tickets.find((t) => t.status === 'open')!;

    await act(async () => { state.resolveTicket(openTicket.id); });
    const ticketsAfter = states.at(-1)!.tickets.find((t) => t.id === openTicket.id)!;
    expect(ticketsAfter.status).toBe('resolved');
    // The charger must return to service now that its fault is cleared.
    const station = states.at(-1)!.stations.find((s) => s.id === openTicket.stationId)!;
    expect(station.status).toBe('available');
    expect(station.note).toBeUndefined();
  });
});

describe('violations and billing mutators', () => {
  beforeEach(() => providerTimers.beforeEach());
  afterEach(() => providerTimers.afterEach());

  it('submitAppeal moves the citation to contested with a pending appeal', async () => {
    const { states } = mountWithProbe();
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    const state = states.at(-1)!;
    const citation = state.violations.find((v) => v.status === 'open')!;

    await act(async () => { state.submitAppeal(citation.id, 'x'.repeat(60), 'photo.jpg'); });
    const after = states.at(-1)!.violations.find((v) => v.id === citation.id)!;
    expect(after.status).toBe('contested');
    expect(after.appeal?.status).toBe('pending');
    expect(after.appeal?.evidenceFileName).toBe('photo.jpg');
  });

  it('resolveViolation dismisses with approval; uphold denies the appeal', async () => {
    const { states } = mountWithProbe();
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    const contested = states.at(-1)!.violations.filter((v) => v.status === 'contested');
    const [first, second] = [contested[0]!, contested[1]!];

    await act(async () => { states.at(-1)!.resolveViolation(first.id, 'dismissed'); });
    const dismissed = states.at(-1)!.violations.find((v) => v.id === first.id)!;
    expect(dismissed.resolvedAt).toBeDefined();
    expect(dismissed.appeal?.status).toBe('approved');

    await act(async () => { states.at(-1)!.resolveViolation(second.id, 'upheld'); });
    const upheld = states.at(-1)!.violations.find((v) => v.id === second.id)!;
    expect(upheld.appeal?.status).toBe('denied');
  });

  it('issueInvoice creates a draft with 21-day terms; markInvoicePaid completes it', async () => {
    const { states } = mountWithProbe();
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    const state = states.at(-1)!;
    const before = state.invoices.length;

    let invoice!: ReturnType<Mutable['issueInvoice']>;
    await act(async () => {
      invoice = state.issueInvoice({
        holderId: 'PH-001',
        holderName: 'Dana Whitfield',
        holderCompany: 'Vertex',
        period: '2026-10',
        lineItems: [{ description: 'Executive permit — 2026-10', amountCents: 320_00 }],
      });
    });

    expect(invoice.status).toBe('draft');
    expect(states.at(-1)!.invoices).toHaveLength(before + 1);
    expect(invoice.dueAt - invoice.issuedAt).toBe(21 * 86_400_000);

    await act(async () => { states.at(-1)!.markInvoicePaid(invoice.id); });
    const paid = states.at(-1)!.invoices.find((i) => i.id === invoice.id)!;
    expect(paid.status).toBe('paid');
    expect(paid.paidAt).toBeDefined();
  });
});

describe('simulation tick (connected)', () => {
  beforeEach(() => providerTimers.beforeEach());
  afterEach(() => providerTimers.afterEach());

  it('occasionally appends gate reads while connected', async () => {
    const { states } = mountWithProbe();
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    const gateBefore = states.at(-1)!.gateEvents.length;
    // 40 ticks × 25% probability ⇒ a read is overwhelmingly likely.
    await advanceTicks(40);
    const after = states.at(-1)!.gateEvents;
    expect(after.length).toBeGreaterThan(gateBefore);
    expect(after[0]!.detail).toContain('ANPR match');
  });

  it('marks changed bays in recentlyChanged on spot transitions', async () => {
    const { states } = mountWithProbe();
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    // Many ticks: any transition must surface in recentlyChanged.
    await advanceTicks(60);
    const state = states.at(-1)!;
    for (const bayId of state.recentlyChanged) {
      expect(state.spots.some((s) => s.id === bayId)).toBe(true);
    }
  });

  it('does not run the tick before the handshake completes', async () => {
    const { states } = mountWithProbe();
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    // Still connecting at 500ms (seed lands at 600ms); no tick has run.
    expect(states.at(-1)!.connection).toBe('connecting');
    expect(states.at(-1)!.spots).toHaveLength(0);
    await act(async () => { await vi.advanceTimersByTimeAsync(1_500); });
    expect(states.at(-1)!.connection).toBe('connected');
  });

  it('advances the wall clock on every tick (timestamp re-render contract)', async () => {
    const { latest } = mountWithProbe();
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    const before = latest().now;
    await advanceTicks(2);
    expect(latest().now).toBeGreaterThan(before);
  });
});
