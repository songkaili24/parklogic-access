'use client';

import * as React from 'react';

import type {
  ActivityEvent,
  AlertSeverity,
  ChargingSession,
  ChargingStation,
  ConnectionStatus,
  EvPricing,
  GateEvent,
  MaintenanceTicket,
  OccupancySummary,
  ParkingSpot,
  PermitHolder,
  SpotStatus,
  SystemAlert,
  VisitorPass,
  VisitorVisit,
  WaitlistEntry,
} from '@/lib/types';
import { summarizeOccupancy } from '@/lib/occupancy';
import { EV_PRICING_DEFAULTS, PLATE_POOL } from '@/lib/constants';
import { uid } from '@/lib/utils';
import {
  generateGateEvents,
  generateInitialAlerts,
  generateInitialEvents,
  generatePermitHolders,
  generateSessions,
  generateSpots,
  generateStations,
  generateTickets,
  generateVisitHistory,
  generateVisitorPasses,
  generateWaitlist,
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

export interface NewPermitInput {
  name: string;
  company: string;
  permitType: PermitHolder['permitType'];
  plate: string;
  vehicle: string;
  vehicleClass: PermitHolder['vehicleClass'];
  assignedBay?: string;
  validThrough?: string;
}

export interface NewPassInput {
  guestName: string;
  company?: string;
  host: string;
  plate: string;
  /** Optional pre-assigned visitor bay (L1 zone A by default). */
  spot?: string;
  validFrom: number;
  validUntil: number;
}

export interface RealtimeContextValue {
  connection: ConnectionStatus;
  spots: ParkingSpot[];
  holders: PermitHolder[];
  visits: VisitorVisit[];
  activity: ActivityEvent[];
  alerts: SystemAlert[];
  summary: OccupancySummary;
  passes: VisitorPass[];
  /** Ticking wall clock used for relative timestamps. */
  now: number;
  acknowledgeAlert: (id: string) => void;
  raiseAlert: (severity: AlertSeverity, title: string, message: string, source: string) => void;
  issuePass: (draft: NewPassInput) => VisitorPass;
  issueBulkPasses: (
    count: number,
    opts: { guestName: string; host: string; validFrom: number; validUntil: number },
  ) => VisitorPass[];
  reserveSpot: (spotId: string, holderId?: string) => void;
  releaseSpot: (spotId: string) => void;
  reportSpotIssue: (spotId: string, note?: string) => void;
  assignPermit: (input: NewPermitInput) => PermitHolder;
}

const RealtimeContext = React.createContext<RealtimeContextValue | null>(null);

const SIM_TICK_MS = 5_000;

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [connection, setConnection] = React.useState<ConnectionStatus>('connecting');
  const [spots, setSpots] = React.useState<ParkingSpot[]>([]);
  const [activity, setActivity] = React.useState<ActivityEvent[]>([]);
  const [alerts, setAlerts] = React.useState<SystemAlert[]>([]);
  const [passes, setPasses] = React.useState<VisitorPass[]>([]);
  const [holders, setHolders] = React.useState<PermitHolder[]>([]);
  const [visits, setVisits] = React.useState<VisitorVisit[]>([]);
  const [stations, setStations] = React.useState<ChargingStation[]>([]);
  const [sessions, setSessions] = React.useState<ChargingSession[]>([]);
  const [tickets, setTickets] = React.useState<MaintenanceTicket[]>([]);
  const [pricing, setPricing] = React.useState<EvPricing>(EV_PRICING_DEFAULTS);
  const [gateEvents, setGateEvents] = React.useState<GateEvent[]>([]);
  const [waitlist, setWaitlist] = React.useState<WaitlistEntry[]>([]);
  const [now, setNow] = React.useState(() => Date.now());

  const spotsRef = React.useRef<ParkingSpot[]>([]);
  const sessionsRef = React.useRef<ChargingSession[]>([]);
  const stationsRef = React.useRef<ChargingStation[]>([]);
  React.useEffect(() => {
    spotsRef.current = spots;
  }, [spots]);

  // Handshake phase — a real client would await the socket "open" here.
  React.useEffect(() => {
    const connect = window.setTimeout(() => {
      const holdersSeed = generatePermitHolders();
      setHolders(holdersSeed);
      setSpots(generateSpots(holdersSeed));
      setPasses(generateVisitorPasses());
      setVisits(generateVisitHistory());
      const stationsSeed = generateStations();
      setStations(stationsSeed);
      setSessions(generateSessions(stationsSeed));
      setTickets(generateTickets());
      setGateEvents(generateGateEvents());
      setWaitlist(generateWaitlist());
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

  const patchSpot = React.useCallback((spotId: string, patch: Partial<ParkingSpot>) => {
    setSpots((prev) =>
      prev.map((spot) => (spot.id === spotId ? { ...spot, ...patch, updatedAt: Date.now() } : spot)),
    );
  }, []);

  const nextVisitorBay = React.useCallback((): string => {
    const open = spotsRef.current.find(
      (spot) => spot.type === 'visitor' && spot.status === 'available',
    );
    return open?.id ?? 'L1-A06';
  }, []);

  const issuePass = React.useCallback<RealtimeContextValue['issuePass']>(
    (draft) => {
      const bayId = draft.spot ?? nextVisitorBay();
      const [level, spot] = bayId.split('-');
      const pass: VisitorPass = {
        ...draft,
        code: `PL-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random()
          .toString(36)
          .slice(2, 6)
          .toUpperCase()}`,
        level: level ?? 'L1',
        spot: spot ?? 'A06',
        status: draft.validFrom > Date.now() + 60_000 ? 'scheduled' : 'active',
      };
      setPasses((prev) => [pass, ...prev]);
      patchSpot(bayId, { status: 'reserved', plate: draft.plate, occupiedSince: undefined });
      pushActivity({
        id: uid('evt'),
        timestamp: Date.now(),
        kind: 'pass_issued',
        message:
          pass.status === 'scheduled'
            ? `Visitor pass ${pass.code} pre-registered for ${pass.guestName} — host ${pass.host} notified`
            : `Visitor pass ${pass.code} issued to ${pass.guestName}`,
        actor: 'Control Room',
        spot: bayId,
      });
      return pass;
    },
    [nextVisitorBay, patchSpot, pushActivity],
  );

  const issueBulkPasses = React.useCallback<RealtimeContextValue['issueBulkPasses']>(
    (count, opts) => {
      const created: VisitorPass[] = [];
      for (let i = 0; i < count; i++) {
        const bayId = nextVisitorBay();
        const [level, spot] = bayId.split('-');
        const pass: VisitorPass = {
          code: `PL-EV${String(i + 1).padStart(2, '0')}-${Math.random()
            .toString(36)
            .slice(2, 6)
            .toUpperCase()}`,
          guestName: `${opts.guestName} ${i + 1}`,
          host: opts.host,
          plate: 'TBD',
          level: level ?? 'L1',
          spot: spot ?? 'A06',
          validFrom: opts.validFrom,
          validUntil: opts.validUntil,
          status: 'scheduled',
        };
        created.push(pass);
        patchSpot(bayId, { status: 'reserved', occupiedSince: undefined });
      }
      setPasses((prev) => [...created, ...prev]);
      pushActivity({
        id: uid('evt'),
        timestamp: Date.now(),
        kind: 'pass_issued',
        message: `Bulk issue — ${count} passes generated for "${opts.guestName}"`,
        actor: 'Control Room',
      });
      return created;
    },
    [nextVisitorBay, patchSpot, pushActivity],
  );

  const reserveSpot = React.useCallback<RealtimeContextValue['reserveSpot']>(
    (spotId, holderId) => {
      const holder = holders.find((h) => h.id === holderId);
      patchSpot(spotId, {
        status: 'reserved',
        holderId,
        plate: holder?.plate,
        occupiedSince: undefined,
      });
      if (holder) {
        setHolders((prev) =>
          prev.map((h) => (h.id === holderId ? { ...h, assignedBay: spotId } : h)),
        );
      }
      pushActivity({
        id: uid('evt'),
        timestamp: Date.now(),
        kind: 'allocation',
        message: holder
          ? `Bay ${spotId} reserved for ${holder.name} (${holder.permitType} permit)`
          : `Bay ${spotId} placed on administrative hold`,
        actor: 'Control Room',
        spot: spotId,
      });
    },
    [holders, patchSpot, pushActivity],
  );

  const releaseSpot = React.useCallback<RealtimeContextValue['releaseSpot']>(
    (spotId) => {
      const spot = spotsRef.current.find((s) => s.id === spotId);
      patchSpot(spotId, {
        status: 'available',
        holderId: undefined,
        plate: undefined,
        occupiedSince: undefined,
      });
      if (spot?.holderId) {
        setHolders((prev) =>
          prev.map((h) => (h.assignedBay === spotId ? { ...h, assignedBay: undefined } : h)),
        );
      }
      pushActivity({
        id: uid('evt'),
        timestamp: Date.now(),
        kind: 'allocation',
        message: `Bay ${spotId} released to available pool`,
        actor: 'Control Room',
        spot: spotId,
      });
    },
    [patchSpot, pushActivity],
  );

  const reportSpotIssue = React.useCallback<RealtimeContextValue['reportSpotIssue']>(
    (spotId, note) => {
      patchSpot(spotId, { status: 'offline', plate: undefined, occupiedSince: undefined });
      raiseAlert(
        'warning',
        `Maintenance hold — bay ${spotId}`,
        note ?? 'Bay reported by control room; sensor/maintenance sweep scheduled.',
        'Allocations',
      );
      pushActivity({
        id: uid('evt'),
        timestamp: Date.now(),
        kind: 'maintenance',
        message: `Bay ${spotId} taken offline for maintenance`,
        actor: 'Control Room',
        spot: spotId,
      });
    },
    [patchSpot, pushActivity, raiseAlert],
  );

  const assignPermit = React.useCallback<RealtimeContextValue['assignPermit']>(
    (input) => {
      const holder: PermitHolder = {
        ...input,
        id: uid('PH'),
        validThrough:
          input.validThrough ?? new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10),
      };
      setHolders((prev) => [...prev, holder]);
      if (input.assignedBay) {
        patchSpot(input.assignedBay, {
          status: 'reserved',
          holderId: holder.id,
          plate: holder.plate,
          occupiedSince: undefined,
        });
      }
      pushActivity({
        id: uid('evt'),
        timestamp: Date.now(),
        kind: 'allocation',
        message: `${holder.permitType} permit issued to ${holder.name} (${holder.plate})${input.assignedBay ? ` — bay ${input.assignedBay}` : ' — unassigned'}`,
        actor: 'Permits Desk',
        spot: input.assignedBay,
      });
      return holder;
    },
    [patchSpot, pushActivity],
  );

  const summary = React.useMemo(() => summarizeOccupancy(spots), [spots]);

  const value = React.useMemo(
    () => ({
      connection,
      spots,
      holders,
      passes,
      visits,
      activity,
      alerts,
      summary,
      now,
      acknowledgeAlert,
      raiseAlert,
      issuePass,
      issueBulkPasses,
      reserveSpot,
      releaseSpot,
      reportSpotIssue,
      assignPermit,
    }),
    [
      connection,
      spots,
      holders,
      passes,
      visits,
      activity,
      alerts,
      summary,
      now,
      acknowledgeAlert,
      raiseAlert,
      issuePass,
      issueBulkPasses,
      reserveSpot,
      releaseSpot,
      reportSpotIssue,
      assignPermit,
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
