import * as React from 'react';
import { cleanup } from '@testing-library/react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';

import { RealtimeProvider, useRealtime, type RealtimeContextValue } from '@/lib/realtime';

export const SIM_TICK_MS = 5_000;

export type Mutable = RealtimeContextValue;

/** Test harness: replays every context snapshot into a plain array. */
function Harness({ onState }: { onState?: (value: RealtimeContextValue) => void }) {
  const value = useRealtime();
  const ref = React.useRef(onState);
  ref.current = onState;
  React.useEffect(() => {
    ref.current?.(value);
  });
  return (
    <ul>
      <li>connection:{value.connection}</li>
      <li>spots:{value.spots.length}</li>
    </ul>
  );
}

export interface ProviderProbe {
  states: RealtimeContextValue[];
  /** Latest snapshot at call time. */
  latest: () => RealtimeContextValue;
}

/** Mounts the provider with a snapshot recorder. */
export function mountWithProbe(): ProviderProbe {
  const states: RealtimeContextValue[] = [];
  render(
    <RealtimeProvider>
      <Harness onState={(v) => states.push(v)} />
    </RealtimeProvider>,
  );
  return { states, latest: () => states.at(-1)! };
}

/**
 * Advances the simulated stream one tick at a time. A single large
 * `advanceTimersByTimeAsync` skips intervals created during the same call
 * (the sim interval registers at the connected flip), so tick-by-tick is
 * the reliable pattern.
 */
export async function advanceTicks(count: number, tickMs = SIM_TICK_MS): Promise<void> {
  const { act } = await import('@testing-library/react');
  for (let i = 0; i < count; i++) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(tickMs);
    });
  }
}

/** Completes the handshake (700ms seed + 1.2s connected flip). */
export async function completeHandshake(): Promise<void> {
  const { act } = await import('@testing-library/react');
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2_000);
  });
}

/** Standard timer lifecycle for provider suites. */
export const providerTimers = {
  beforeEach: () => vi.useFakeTimers(),
  afterEach: () => {
    vi.useRealTimers();
    cleanup();
  },
};
