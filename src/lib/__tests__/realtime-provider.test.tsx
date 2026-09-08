import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { providerTimers, mountWithProbe, advanceTicks, SIM_TICK_MS, type Mutable } from './provider-harness';

describe('RealtimeProvider handshake', () => {
  beforeEach(() => providerTimers.beforeEach());
  afterEach(() => providerTimers.afterEach());

  it('walks connecting → syncing → connected and populates the store', async () => {
    const { states } = mountWithProbe();
    expect(states.at(-1)!.connection).toBe('connecting');
    expect(states.at(-1)!.spots).toHaveLength(0);

    await advanceTicks(0);
    const { act } = await import('@testing-library/react');
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    expect(states.at(-1)!.connection).toBe('syncing');
    expect(states.at(-1)!.spots).toHaveLength(120);
    expect(states.at(-1)!.holders).toHaveLength(20);
    expect(states.at(-1)!.devices).toHaveLength(10);
    expect(states.at(-1)!.violations).toHaveLength(8);
    expect(states.at(-1)!.invoices).toHaveLength(9);
    expect(states.at(-1)!.gateEvents.length).toBeGreaterThan(0);

    await act(async () => { await vi.advanceTimersByTimeAsync(1_200); });
    expect(states.at(-1)!.connection).toBe('connected');
  });

  it('exposes an occupancy summary matching the spot rollup', async () => {
    const { states } = mountWithProbe();
    const { act } = await import('@testing-library/react');
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    const state = states.at(-1)!;
    const inService = state.summary.total - state.summary.offline;
    const expected = Math.round(((inService - state.summary.available) / inService) * 100);
    expect(state.summary.occupancyRate).toBe(expected);
    expect(state.summary.total).toBe(120);
  });
});

describe('operator mutators', () => {
  beforeEach(() => providerTimers.beforeEach());
  afterEach(() => providerTimers.afterEach());

  it('issuePass assigns the next open visitor bay and reserves it', async () => {
    const { states } = mountWithProbe();
    const { act } = await import('@testing-library/react');
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    const state = states.at(-1)!;
    const openBefore = state.spots.filter((s) => s.type === 'visitor' && s.status === 'available').length;
    const nextOpen = state.spots.find((s) => s.type === 'visitor' && s.status === 'available')!;

    let issued!: ReturnType<Mutable['issuePass']>;
    await act(async () => { issued = state.issuePass({ guestName: 'Test Guest', host: 'Front Desk', plate: 'TST-0001', validFrom: Date.now(), validUntil: Date.now() + 3_600_000 }); });

    expect(issued.status).toBe('active');
    expect(issued.code).toMatch(/^PL-/);
    const after = states.at(-1)!;
    expect(after.spots.find((s) => s.id === nextOpen.id)?.status).toBe('reserved');
    expect(after.spots.filter((s) => s.type === 'visitor' && s.status === 'available')).toHaveLength(openBefore - 1);
    expect(after.passes[0]!.code).toBe(issued.code);
    // Journal entry for the issuance.
    expect(after.activity[0]!.kind).toBe('pass_issued');
  });

  it('issuePass pre-registers future arrivals as scheduled with host notification', async () => {
    const { states } = mountWithProbe();
    const { act } = await import('@testing-library/react');
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    const state = states.at(-1)!;
    const future = Date.now() + 24 * 3_600_000;

    let issued!: ReturnType<Mutable['issuePass']>;
    await act(async () => { issued = state.issuePass({ guestName: 'Later Guest', host: 'Dana Whitfield', plate: 'LTR-0001', validFrom: future, validUntil: future + 3_600_000 }); });

    expect(issued.status).toBe('scheduled');
    expect(states.at(-1)!.activity[0]!.message).toContain('pre-registered');
    expect(states.at(-1)!.activity[0]!.message).toContain('Dana Whitfield');
  });

  it('issueBulkPasses journals a bulk event and returns 5 passes', async () => {
    const { states } = mountWithProbe();
    const { act } = await import('@testing-library/react');
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    const state = states.at(-1)!;

    let created!: ReturnType<Mutable['issueBulkPasses']>;
    await act(async () => { created = state.issueBulkPasses(5, { guestName: 'Mixer', host: 'Events', validFrom: Date.now(), validUntil: Date.now() + 3_600_000 }); });

    expect(created).toHaveLength(5);
    expect(states.at(-1)!.activity[0]!.message).toContain('Bulk issue — 5 passes');
  });

  // Regression test: bulk passes previously all patched the same bay because
  // nextVisitorBay() read a stale spotsRef inside the loop.
  it('issueBulkPasses reserves five distinct visitor bays', async () => {
    const { states } = mountWithProbe();
    const { act } = await import('@testing-library/react');
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    const state = states.at(-1)!;
    const reservedBefore = state.spots.filter((s) => s.status === 'reserved').length;

    let created!: ReturnType<Mutable['issueBulkPasses']>;
    await act(async () => { created = state.issueBulkPasses(5, { guestName: 'Mixer', host: 'Events', validFrom: Date.now(), validUntil: Date.now() + 3_600_000 }); });

    const after = states.at(-1)!;
    expect(created).toHaveLength(5);
    // Every pass must hold a different visitor bay.
    const heldBays = created.map((pass) => `${pass.level}-${pass.spot}`);
    expect(new Set(heldBays).size).toBe(5);
    expect(after.spots.filter((s) => s.status === 'reserved')).toHaveLength(reservedBefore + 5);
  });

  it('reserveSpot links a holder; releaseSpot unlinks both sides', async () => {
    const { states } = mountWithProbe();
    const { act } = await import('@testing-library/react');
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    const state = states.at(-1)!;
    const bay = state.spots.find((s) => s.status === 'available')!;
    const holder = state.holders.find((h) => !h.assignedBay)!;

    await act(async () => { state.reserveSpot(bay.id, holder.id); });
    const reserved = states.at(-1)!;
    expect(reserved.spots.find((s) => s.id === bay.id)?.holderId).toBe(holder.id);
    expect(reserved.holders.find((h) => h.id === holder.id)?.assignedBay).toBe(bay.id);

    await act(async () => { reserved.releaseSpot(bay.id); });
    const released = states.at(-1)!;
    expect(released.spots.find((s) => s.id === bay.id)?.status).toBe('available');
    expect(released.spots.find((s) => s.id === bay.id)?.holderId).toBeUndefined();
    expect(released.holders.find((h) => h.id === holder.id)?.assignedBay).toBeUndefined();
  });

  it('reportSpotIssue takes the bay offline and raises a warning alert', async () => {
    const { states } = mountWithProbe();
    const { act } = await import('@testing-library/react');
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    const state = states.at(-1)!;
    const bay = state.spots.find((s) => s.status === 'available')!;

    await act(async () => { state.reportSpotIssue(bay.id); });
    const after = states.at(-1)!;
    expect(after.spots.find((s) => s.id === bay.id)?.status).toBe('offline');
    expect(after.alerts[0]!.severity).toBe('warning');
    expect(after.alerts[0]!.title).toContain(bay.id);
  });

  it('assignPermit adds a holder and claims the bay; default validity is one year', async () => {
    const { states } = mountWithProbe();
    const { act } = await import('@testing-library/react');
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    const state = states.at(-1)!;
    const bay = state.spots.find((s) => s.status === 'available')!;
    const holdersBefore = state.holders.length;

    let holder!: ReturnType<Mutable['assignPermit']>;
    await act(async () => { holder = state.assignPermit({ name: 'New Tenant', company: 'ACME', permitType: 'monthly', plate: 'NEW-0001', vehicle: 'Test Sedan', vehicleClass: 'sedan', assignedBay: bay.id }); });

    const after = states.at(-1)!;
    expect(after.holders).toHaveLength(holdersBefore + 1);
    expect(holder.assignedBay).toBe(bay.id);
    expect(holder.validThrough).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(after.spots.find((s) => s.id === bay.id)?.status).toBe('reserved');
  });

  it('acknowledgeAlert marks the alert and journals exactly once', async () => {
    const { states } = mountWithProbe();
    const { act } = await import('@testing-library/react');
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    const state = states.at(-1)!;
    const alert = state.alerts.find((a) => !a.acknowledged)!;
    const journalBefore = state.activity.filter((a) => a.kind === 'alert_ack').length;

    await act(async () => { state.acknowledgeAlert(alert.id); });
    await act(async () => { states.at(-1)!.acknowledgeAlert(alert.id); });

    const after = states.at(-1)!;
    expect(after.alerts.find((a) => a.id === alert.id)?.acknowledged).toBe(true);
    expect(after.activity.filter((a) => a.kind === 'alert_ack').length).toBe(journalBefore + 1);
  });

  it('addToWaitlist queues per category position', async () => {
    const { states } = mountWithProbe();
    const { act } = await import('@testing-library/react');
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    const state = states.at(-1)!;
    const monthlyBefore = state.waitlist.filter((w) => w.permitType === 'monthly').length;

    await act(async () => { state.addToWaitlist({ name: 'Queue Me', company: 'ACME', permitType: 'monthly', plate: 'Q-0001', vehicle: 'Sedan', requestedAt: Date.now() }); });

    const after = states.at(-1)!;
    const monthly = after.waitlist.filter((w) => w.permitType === 'monthly');
    expect(monthly).toHaveLength(monthlyBefore + 1);
    expect(monthly.at(-1)!.position).toBe(monthly.length);
  });
});
