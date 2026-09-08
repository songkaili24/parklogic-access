import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ParkingSpotCell } from '@/components/ui/ParkingSpotCell';
import { GarageMapPlaceholder } from '@/components/ui/GarageMapPlaceholder';
import { LicensePlateInput } from '@/components/ui/LicensePlateInput';
import { TimePicker } from '@/components/ui/TimePicker';
import { SpaceDetailPanel } from '@/components/ui/SpaceDetailPanel';
import type { ParkingSpot } from '@/lib/types';

const spot = (overrides: Partial<ParkingSpot> = {}): ParkingSpot => ({
  id: 'L1-A01',
  level: 'L1',
  zone: 'A',
  status: 'available',
  type: 'visitor',
  updatedAt: 1_000,
  ...overrides,
});

/** Stateful wrapper: LicensePlateInput is a controlled component. */
function PlateHarness({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = React.useState('');
  return (
    <LicensePlateInput
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

const setupUser = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('ParkingSpotCell state-change pulse (micro-interaction contract)', () => {
  it('renders the bay id and status in the accessible label', () => {
    render(<ParkingSpotCell spot={spot({ id: 'L2-C07', plate: 'ABC-1234' })} />);
    expect(screen.getByRole('button', { name: /L2-C07 — available · ABC-1234/ })).toBeInTheDocument();
  });

  it('does not pulse when updatedAt is unchanged across a rerender', () => {
    const { rerender } = render(<ParkingSpotCell spot={spot()} />);
    expect(screen.getByRole('button').className).not.toContain('animate-state-pulse');
    rerender(<ParkingSpotCell spot={spot()} />);
    expect(screen.getByRole('button').className).not.toContain('animate-state-pulse');
  });

  it('fires the one-shot pulse when updatedAt changes, then clears it', async () => {
    const { rerender } = render(<ParkingSpotCell spot={spot()} />);
    rerender(<ParkingSpotCell spot={spot({ status: 'occupied', plate: 'XYZ-0001', updatedAt: 5_000 })} />);
    expect(screen.getByRole('button').className).toContain('animate-state-pulse');

    // Pulse clears itself after 1.2s (the component's own timeout).
    await act(async () => { await vi.advanceTimersByTimeAsync(1_300); });
    expect(screen.getByRole('button').className).not.toContain('animate-state-pulse');
  });

  it('reports selection through aria-pressed', async () => {
    const onSelect = vi.fn();
    const user = setupUser();
    render(<ParkingSpotCell spot={spot()} onSelect={onSelect} />);
    await user.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe('GarageMapPlaceholder viewBox (regression: console-error fix)', () => {
  it('interpolates the zone count into the viewBox instead of a literal template', () => {
    const zones = [
      { name: 'A', label: 'Zone A', total: 12, available: 4 },
      { name: 'B', label: 'Zone B', total: 16, available: 6 },
      { name: 'C', label: 'Zone C', total: 16, available: 9 },
    ];
    const { container } = render(
      <GarageMapPlaceholder
        levels={[{ id: 'L1', label: 'L1', total: 44, available: 19 }]}
        activeLevel="L1"
        zones={zones}
      />,
    );
    const svg = container.querySelector('svg')!;
    // 3 zones × 22 + 40 = 106. The regression rendered the literal string
    // "0 0 460 {zones.length * 22 + 40}", which threw a console error.
    expect(svg.getAttribute('viewBox')).toBe('0 0 460 106');
  });

  it('marks the active level and switches levels on click', async () => {
    const onSelect = vi.fn();
    const user = setupUser();
    const zones = [{ name: 'A', label: 'Zone A', total: 12, available: 4 }];
    render(
      <GarageMapPlaceholder
        levels={[
          { id: 'L1', label: 'L1', total: 44, available: 19 },
          { id: 'L2', label: 'L2', total: 42, available: 8 },
        ]}
        activeLevel="L1"
        onSelectLevel={onSelect}
        zones={zones}
      />,
    );
    expect(screen.getByRole('button', { name: 'L2' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'L2' }));
    expect(onSelect).toHaveBeenCalledWith('L2');
  });
});

describe('LicensePlateInput', () => {
  it('normalizes to uppercase and strips disallowed characters', async () => {
    const onChange = vi.fn();
    const user = setupUser();
    render(<PlateHarness onChange={onChange} />);
    await user.type(screen.getByPlaceholderText('ABC-1234'), 'ab1!');
    const last = onChange.mock.calls.at(-1)![0] as string;
    expect(last).toBe('AB1');
  });

  it('caps input at 10 characters', async () => {
    const onChange = vi.fn();
    const user = setupUser();
    render(<PlateHarness onChange={onChange} />);
    await user.type(screen.getByPlaceholderText('ABC-1234'), 'ABCDEFGHIJKLMNOP');
    const last = onChange.mock.calls.at(-1)![0] as string;
    expect(last.length).toBeLessThanOrEqual(10);
  });

  it('shows the normalized gate format for a valid 7-character plate', async () => {
    const onChange = vi.fn();
    const user = setupUser();
    render(<PlateHarness onChange={onChange} />);
    await user.type(screen.getByPlaceholderText('ABC-1234'), 'abc1234');
    const last = onChange.mock.calls.at(-1)![0] as string;
    expect(last).toBe('ABC1234');
    expect(screen.getByText(/gate entry as ABC-1234/)).toBeInTheDocument();
  });

  it('reports the gate-side error for an invalid plate', async () => {
    const onChange = vi.fn();
    const user = setupUser();
    render(<PlateHarness onChange={onChange} />);
    await user.type(screen.getByPlaceholderText('ABC-1234'), 'a');
    expect(screen.getByText('Too short — minimum 2 characters')).toBeInTheDocument();
  });
});

describe('TimePicker', () => {
  it('renders preset windows as a radiogroup', () => {
    render(<TimePicker value={120} onChange={() => {}} />);
    const group = screen.getByRole('radiogroup', { name: 'Reservation duration' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '2 hr' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '30 min' })).not.toBeChecked();
  });

  it('clamps the custom stepper at the 24-hour maximum', async () => {
    const onChange = vi.fn();
    const user = setupUser();
    render(<TimePicker value={1440} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Increase duration' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Increase duration' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clamps at the 30-minute minimum', async () => {
    const onChange = vi.fn();
    const user = setupUser();
    render(<TimePicker value={30} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Decrease duration' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Decrease duration' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('steps by the configured increment', async () => {
    const onChange = vi.fn();
    const user = setupUser();
    render(<TimePicker value={120} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Increase duration' }));
    expect(onChange).toHaveBeenCalledWith(150);
  });
});

describe('SpaceDetailPanel', () => {
  const now = new Date(2026, 8, 8, 10, 30).getTime();
  const baseActions = {
    onClose: () => {},
    onAssignPermit: () => {},
    onMarkAvailable: () => {},
    onReportIssue: () => {},
  };

  it('shows bay location, status, and dwell for an occupied bay', () => {
    render(
      <SpaceDetailPanel
        spot={spot({ id: 'L2-D04', status: 'occupied', plate: '7KJH221', occupiedSince: now - 90 * 60_000 })}
        now={now}
        {...baseActions}
      />,
    );
    expect(screen.getByText('Bay L2-D04')).toBeInTheDocument();
    expect(screen.getByText('7KJH221')).toBeInTheDocument();
    expect(screen.getByText(/1h 30m/)).toBeInTheDocument();
  });

  it('exposes operator actions and disables Mark Available on an open bay', () => {
    render(<SpaceDetailPanel spot={spot()} now={now} {...baseActions} />);
    expect(screen.getByRole('button', { name: /Assign Permit/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Mark Available/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Report Issue/ })).toBeEnabled();
  });

  it('renders the assigned permit holder with renewal state', () => {
    render(
      <SpaceDetailPanel
        spot={spot({ status: 'occupied', holderId: 'PH-008', occupiedSince: now - 30 * 60_000 })}
        holder={{
          id: 'PH-008',
          name: 'Cole Barrett',
          company: 'Elevate Mechanical',
          permitType: 'contractor',
          plate: 'HLM-2207',
          vehicle: 'Ford F-150',
          vehicleClass: 'pickup',
          assignedBay: 'L1-B09',
          validThrough: '2026-09-01',
        }}
        now={now}
        {...baseActions}
      />,
    );
    expect(screen.getByText('Cole Barrett')).toBeInTheDocument();
    expect(screen.getByText(/expired/i)).toBeInTheDocument();
  });
});
