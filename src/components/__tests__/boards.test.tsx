import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RealtimeProvider, useRealtime } from '@/lib/realtime';
import { HardwareBoard } from '@/components/hardware/HardwareBoard';
import { ViolationsBoard } from '@/components/violations/ViolationsBoard';
import { BillingBoard } from '@/components/billing/BillingBoard';
import { SkeletonStat } from '@/components/dashboard/LiveSignals';
import { ActivityLog } from '@/components/ui/ActivityLog';
import type { RealtimeContextValue } from '@/lib/realtime';

const setupUser = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

function Board({ children }: { children: React.ReactNode }) {
  return <RealtimeProvider>{children}</RealtimeProvider>;
}

/** Advances through the provider handshake so seeded data is on screen. */
async function completeHandshake() {
  await act(async () => { await vi.advanceTimersByTimeAsync(2_000); });
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('HardwareBoard', () => {
  it('renders the fleet with statuses after the handshake', async () => {
    render(<Board><HardwareBoard /></Board>);
    await completeHandshake();
    expect(screen.getAllByText('GW-P1-01').length).toBeGreaterThan(0);
    expect(screen.getAllByText('EVC-L3-01').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('article')).toHaveLength(10);
  });

  it('surfaces the active error log entries', async () => {
    render(<Board><HardwareBoard /></Board>);
    await completeHandshake();
    expect(screen.getAllByText(/Lens contamination/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Bill acceptor jam/).length).toBeGreaterThan(0);
  });

  it('reboot dialog shows the exact command; confirming takes the device down', async () => {
    const user = setupUser();
    render(<Board><HardwareBoard /></Board>);
    await completeHandshake();

    await user.click(screen.getAllByRole('button', { name: 'Reboot…' })[0]!);
    const dialog = screen.getByRole('dialog', { name: /Reboot/ }) as HTMLElement;
    expect(within(dialog).getByText(/plctl device reboot --id/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Confirm Reboot' }));
    expect(screen.getAllByText('rebooting').length).toBeGreaterThan(0);
  });
});

describe('ViolationsBoard', () => {
  it('renders citations with fines and evidence refs', async () => {
    render(<Board><ViolationsBoard /></Board>);
    await completeHandshake();
    expect(screen.getAllByText(/V-2026-10/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$[0-9]+/).length).toBeGreaterThan(0);
  });

  it('status filter narrows the board to matching citations', async () => {
    const user = setupUser();
    render(<Board><ViolationsBoard /></Board>);
    await completeHandshake();
    await user.click(screen.getByRole('radio', { name: 'dismissed' }));
    // Dismissed citation is V-2026-1004; the open fire-lane 1000... is V-2026-1001.
    expect(screen.getByText('V-2026-1005')).toBeInTheDocument();
    expect(screen.queryByText('V-2026-1001')).not.toBeInTheDocument();
  });

  it('blocks an appeal under 50 characters, then accepts a valid one', async () => {
    const user = setupUser();
    render(<Board><ViolationsBoard /></Board>);
    await completeHandshake();

    await user.click(screen.getAllByRole('button', { name: 'File Appeal' })[0]!);
    const statement = screen.getByLabelText('Appeal statement');
    await user.type(statement, 'Too short.');
    await user.click(screen.getByRole('button', { name: 'Submit Appeal' }));
    expect(screen.getByText(/minimum 50 characters/)).toBeInTheDocument();

    await user.type(statement, ' The vehicle was covered by visitor pass PL-K4TZ-9MQ2 issued the same afternoon.');
    await user.click(screen.getByRole('button', { name: 'Submit Appeal' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(screen.getAllByText('contested').length).toBeGreaterThan(0);
  });
});

describe('BillingBoard', () => {
  it('renders seeded invoices with payment statuses', async () => {
    render(<Board><BillingBoard /></Board>);
    await completeHandshake();
    expect(screen.getByText('INV-2026-101')).toBeInTheDocument();
    expect(screen.getAllByText('overdue').length).toBeGreaterThan(0);
  });

  it('gate-keeps receipt downloads for draft invoices', async () => {
    render(<Board><BillingBoard /></Board>);
    await completeHandshake();
    const draftRow = screen.getByText('INV-2026-109').closest('tr') as HTMLElement;
    expect(within(draftRow).getByRole('button', { name: 'Receipt' })).toBeDisabled();
  });

  it('generate dialog rejects consumer email, then issues a draft invoice', async () => {
    const user = setupUser();
    render(<Board><BillingBoard /></Board>);
    await completeHandshake();

    await user.click(screen.getByRole('button', { name: 'Generate Invoice' }));
    const dialog = screen.getByRole('dialog', { name: 'Generate invoice' }) as HTMLElement;

    await user.click(within(dialog).getByRole('button', { name: 'Generate Draft' }));
    expect(within(dialog).getByText(/Company email required/)).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Billing contact (company email)'), 'ops@vertexanalytics.com');
    await user.click(within(dialog).getByRole('button', { name: 'Generate Draft' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(screen.getAllByText(/INV-2026-1/).length).toBeGreaterThan(0);
  });

  it('marks a sent invoice as paid', async () => {
    const user = setupUser();
    render(<Board><BillingBoard /></Board>);
    await completeHandshake();
    const sentRow = screen.getByText('INV-2026-101').closest('tr') as HTMLElement;
    await user.click(within(sentRow).getByRole('button', { name: /Paid/ }));
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    const paidRow = screen.getByText('INV-2026-101').closest('tr') as HTMLElement;
    expect(within(paidRow).getByText('paid')).toBeInTheDocument();
  });
});

describe('shared primitives', () => {
  it('SkeletonStat exposes an accessible loading state', () => {
    render(<SkeletonStat label="Occupancy" />);
    expect(screen.getByRole('status', { name: 'Occupancy — loading' })).toBeInTheDocument();
  });

  it('ActivityLog renders the journal with slide-in rows', () => {
    const now = Date.now();
    render(
      <ActivityLog
        events={[
          { id: 'a', timestamp: now - 60_000, kind: 'entry', message: 'ANPR match — vehicle in to L1-A01', actor: '7KJH221' },
          { id: 'b', timestamp: now - 30_000, kind: 'charge_started', message: 'Charging session started on EV-L3-F01', actor: 'Dana' },
        ]}
      />,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText(/ANPR match/)).toBeInTheDocument();
    expect(screen.getByText(/Charging session started/)).toBeInTheDocument();
  });

  it('exposes provider context for board-level consumers (smoke)', () => {
    let captured: RealtimeContextValue | undefined;
    function Grabber() {
      const value = useRealtime();
      captured = value;
      return null;
    }
    render(<Board><Grabber /></Board>);
    expect(captured).toBeDefined();
    expect(captured!.summary.total).toBe(0); // pre-handshake
  });
});
