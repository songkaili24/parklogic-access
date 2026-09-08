'use client';

import * as React from 'react';

import type {
  ActivityEvent,
  AlertSeverity,
  ConnectionStatus,
  OccupancySummary,
  ParkingSpot,
  SpotStatus,
  SystemAlert,
  VisitorPass,
} from '@/lib/types';
import { summarizeOccupancy } from '@/lib/occupancy';
import { PLATE_POOL } from '@/lib/constants';
import { uid } from '@/lib/utils';
import {
  generateInitialAlerts,
  generateInitialEvents,
  generateSpots,
  LEVELS,
  ZONES,
} from '@/lib/seed';

/**
 * RealtimeOrchestrator — seam for a live transport.
 *
 * Today it simulates the gate/spot event stream on a tick; swapping in a
 * real feed means replacing the simulation effect with a WebSocket
 * subscription that calls the same `setSpots` / `pushActivity` /
 * `setAlerts` mutators. The component tree stays untouched.
 */

export interface RealtimeContextValue {
  connection: ConnectionStatus;
  spots: ParkingSpot[];
  activity: ActivityEvent[];
  alerts: SystemAlert[];
  summary: OccupancySummary;
  passes: VisitorPass[];
  /** Ticking wall clock used for relative timestamps. */
  now: number;
  acknowledgeAlert: (id: string) => void;
  raiseAlert: (severity: AlertSeverity, title: string, message: string, source: string) => void;
  issuePass: (draft: Omit<VisitorPass, 'code' | 'status' | 'validFrom'>) => VisitorPass;
  toggleSpotStatus: (spotId: string) => void;
}

const RealtimeContext = React.createContext<RealtimeContextValue | null>(null);

const SIM_TICK_MS = 5_000;

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [connection, setConnection] = React.useState<ConnectionStatus>('connecting');
  const [spots, setSpots] = React.useState<ParkingSpot[]>([]);
  const [activity, setActivity] = React.useState<ActivityEvent[]>([]);
  const [alerts, setAlerts] = React.useState<SystemAlert[]>([]);
  const [passes, setPasses] = React.useState<VisitorPass[]>([]);
  const [now, setNow] = React.useState(() => Date.now());

  const spotsRef = React.useRef<ParkingSpot[]>([]);
  React.useEffect(() => {
    spotsRef.current = spots;
  }, [spots]);

  // Handshake phase — a real client would await the socket "open" here.
  React.useEffect(() => {
    const connect = window.setTimeout(() => {
      setSpots(generateSpots());
      setActivity(generateInitialEvents());
      setAlerts(generateInitialAlerts());
      setConnection('syncing');
    }, 600);
    const synced = window.setTimeout(() => setConnection('connected'), 1_800);
    return () => {
      window.clearTimeout(connect);
      window.clearTimeout(synced);
    };
  }, []);

  const pushActivity = React.useCallback((event: ActivityEvent) => {
    setActivity((prev) => [event, ...prev].slice(0, 40));
  }, []);

  // Simulated upstream event stream. Replace body with WS message handling.
  React.useEffect(() => {
    if (connection !== 'connected') return;
    const interval = window.setInterval(() => {
      const current = spotsRef.current;
      if (current.length === 0) return;

      const level = LEVELS[Math.floor(Math.random() * LEVELS.length)] ?? 'L1';
      const zone = ZONES[level][Math.floor(Math.random() * ZONES[level].length)] ?? 'A';
      const zoneSpots = current.filter((spot) => spot.level === level && spot.zone === zone);
      const spot = zoneSpots[Math.floor(Math.random() * zoneSpots.length)];
      if (!spot || spot.status === 'offline') return;

      const plate = PLATE_POOL[Math.floor(Math.random() * PLATE_POOL.length)] ?? 'UNKNOWN';
      const roll = Math.random();

      if (spot.status === 'available' && roll < 0.6) {
        const nextStatus: SpotStatus = spot.type === 'ev' && roll < 0.15 ? 'charging' : 'occupied';
        setSpots((prev) =>
          prev.map((s) =>
            s.id === spot.id
              ? {
                  ...s,
                  status: nextStatus,
                  plate,
                  occupiedSince: Date.now(),
                  updatedAt: Date.now(),
                }
              : s,
          ),
        );
        pushActivity({
          id: uid('evt'),
          timestamp: Date.now(),
          kind: nextStatus === 'charging' ? 'charge_started' : 'entry',
          message:
            nextStatus === 'charging'
              ? `Charging session started on ${spot.id}`
              : `ANPR match — vehicle in to ${spot.id}`,
          actor: plate,
          spot: spot.id,
        });
      } else if (spot.status !== 'available' && roll < 0.55) {
        setSpots((prev) =>
          prev.map((s) =>
            s.id === spot.id
              ? {
                  ...s,
                  status: 'available',
                  plate: undefined,
                  occupiedSince: undefined,
                  updatedAt: Date.now(),
                }
              : s,
          ),
        );
        pushActivity({
          id: uid('evt'),
          timestamp: Date.now(),
          kind: 'exit',
          message: `Vehicle out from ${spot.id} — bay released`,
          actor: spot.plate ?? 'ticket',
          spot: spot.id,
        });
      }
    }, SIM_TICK_MS);
    return () => window.clearInterval(interval);
  }, [connection, pushActivity]);

  // Clock tick for relative timestamps and the status-bar clock.
  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  const acknowledgeAlert = React.useCallback(
    (id: string) => {
      const alert = alerts.find((a) => a.id === id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
      if (alert && !alert.acknowledged) {
        pushActivity({
          id: uid('evt'),
          timestamp: Date.now(),
          kind: 'alert_ack',
          message: `Alert acknowledged — ${alert.title}`,
          actor: 'Control Room',
        });
      }
    },
    [alerts, pushActivity],
  );

  const raiseAlert = React.useCallback(
    (severity: AlertSeverity, title: string, message: string, source: string) => {
      const alert: SystemAlert = {
        id: uid('alr'),
        severity,
        title,
        message,
        source,
        raisedAt: Date.now(),
        acknowledged: false,
      };
      setAlerts((prev) => [alert, ...prev]);
    },
    [],
  );

  const issuePass = React.useCallback<RealtimeContextValue['issuePass']>(
    (draft) => {
      const pass: VisitorPass = {
        ...draft,
        code: `PL-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random()
          .toString(36)
          .slice(2, 6)
          .toUpperCase()}`,
        validFrom: Date.now(),
        status: 'active',
      };
      setPasses((prev) => [pass, ...prev]);
      pushActivity({
        id: uid('evt'),
        timestamp: Date.now(),
        kind: 'pass_issued',
        message: `Visitor pass ${pass.code} issued to ${pass.guestName}`,
        actor: 'Control Room',
        spot: `${pass.level}-${pass.spot}`,
      });
      return pass;
    },
    [pushActivity],
  );

  const toggleSpotStatus = React.useCallback((spotId: string) => {
    setSpots((prev) =>
      prev.map((spot) => {
        if (spot.id !== spotId) return spot;
        if (spot.status === 'available') {
          return {
            ...spot,
            status: 'occupied',
            plate: PLATE_POOL[Math.floor(Math.random() * PLATE_POOL.length)],
            occupiedSince: Date.now(),
            updatedAt: Date.now(),
          };
        }
        return {
          ...spot,
          status: 'available',
          plate: undefined,
          occupiedSince: undefined,
          updatedAt: Date.now(),
        };
      }),
    );
  }, []);

  const summary = React.useMemo(() => summarizeOccupancy(spots), [spots]);

  const value = React.useMemo(
    () => ({
      connection,
      spots,
      activity,
      alerts,
      summary,
      passes,
      now,
      acknowledgeAlert,
      raiseAlert,
      issuePass,
      toggleSpotStatus,
    }),
    [
      connection,
      spots,
      activity,
      alerts,
      summary,
      passes,
      now,
      acknowledgeAlert,
      raiseAlert,
      issuePass,
      toggleSpotStatus,
    ],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime(): RealtimeContextValue {
  const ctx = React.useContext(RealtimeContext);
  if (!ctx) {
    throw new Error('useRealtime must be used within <RealtimeProvider>');
  }
  return ctx;
}

export function useSpotsForLevel(level: string): ParkingSpot[] {
  const { spots } = useRealtime();
  return React.useMemo(() => spots.filter((spot) => spot.level === level), [spots, level]);
}
