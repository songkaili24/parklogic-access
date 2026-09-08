/** Core domain model for ParkLogic operations. */

export type SpotStatus = 'available' | 'occupied' | 'reserved' | 'charging' | 'offline';

export type SpotType = 'standard' | 'accessible' | 'ev' | 'visitor' | 'compact' | 'motorcycle';

/** Commercial permit categories offered by property management. */
export type PermitType = 'monthly' | 'annual' | 'executive' | 'overflow' | 'contractor' | 'valet';

export type PermitStatus = 'active' | 'expiring' | 'expired';

export type VehicleClass = 'sedan' | 'suv' | 'pickup' | 'van' | 'ev' | 'motorcycle';

export type ConnectionStatus = 'connecting' | 'connected' | 'syncing' | 'offline';

export interface ParkingSpot {
  /** Lot-style identifier, e.g. "L2-C14" (level, zone, position). */
  id: string;
  level: string;
  zone: string;
  status: SpotStatus;
  type: SpotType;
  permit?: PermitType;
  /** Linked permit holder when the bay is permit-assigned. */
  holderId?: string;
  vehicleClass?: VehicleClass;
  plate?: string;
  occupiedSince?: number;
  updatedAt: number;
}

export interface PermitHolder {
  id: string;
  name: string;
  company: string;
  permitType: PermitType;
  plate: string;
  /** Vehicle make/model, e.g. "Tesla Model Y". */
  vehicle: string;
  vehicleClass: VehicleClass;
  /** Bay id when the permit carries a reserved space. */
  assignedBay?: string;
  /** ISO date the permit expires. */
  validThrough: string;
}

export type ActivityKind =
  | 'entry'
  | 'exit'
  | 'pass_issued'
  | 'pass_revoked'
  | 'charge_started'
  | 'charge_complete'
  | 'gate_hold'
  | 'alert_ack'
  | 'allocation'
  | 'maintenance';

export interface ActivityEvent {
  id: string;
  timestamp: number;
  kind: ActivityKind;
  message: string;
  actor?: string;
  spot?: string;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface SystemAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  raisedAt: number;
  acknowledged: boolean;
}

export type VisitorPassStatus = 'active' | 'scheduled' | 'expired' | 'revoked';

export interface VisitorPass {
  /** Scannable pass code printed on the QR payload. */
  code: string;
  guestName: string;
  company?: string;
  /** Host employee the visitor is meeting. */
  host: string;
  plate: string;
  level: string;
  spot: string;
  validFrom: number;
  validUntil: number;
  status: VisitorPassStatus;
}

export interface VisitorVisit {
  id: string;
  guestName: string;
  company?: string;
  host: string;
  plate: string;
  checkIn: number;
  checkOut?: number;
}

export type GateId = 'P1 Entry' | 'P1 Exit' | 'P2 Entry' | 'P2 Exit' | 'Commercial Dock';

export type GateEventType = 'entry' | 'exit' | 'denied' | 'gate_hold' | 'manual_override';

export type GateResult = 'granted' | 'denied' | 'warning';

export type ViolationKind = 'unauthorized' | 'expired_permit' | 'tailgating' | 'blacklisted';

export interface GateEvent {
  id: string;
  timestamp: number;
  eventType: GateEventType;
  plate: string;
  gate: GateId;
  result: GateResult;
  detail?: string;
  violation?: ViolationKind;
  /** Flagged for review by an operator. */
  flagged?: boolean;
}

export interface ChargingStation {
  id: string;
  level: string;
  zone: string;
  network: 'AC Level 2' | 'DC Fast Charge';
  powerKw: number;
  ports: number;
  portsInUse: number;
  status: 'online' | 'offline' | 'degraded';
  loadShed: boolean;
}

export interface ChargingSession {
  id: string;
  stationId: string;
  port: number;
  userName: string;
  plate: string;
  startedAt: number;
  estMinutes: number;
  kwhDelivered: number;
  targetKwh: number;
}

export interface MaintenanceTicket {
  id: string;
  stationId: string;
  openedAt: number;
  severity: 'minor' | 'major';
  summary: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export interface WaitlistEntry {
  id: string;
  name: string;
  company: string;
  permitType: PermitType;
  plate: string;
  vehicle: string;
  position: number;
  requestedAt: number;
}

export interface EvPricing {
  l2PerKwh: number;
  dcfcPerKwh: number;
  sessionFee: number;
  idlePerMin: number;
}

export interface OccupancySummary {
  total: number;
  available: number;
  occupied: number;
  reserved: number;
  charging: number;
  offline: number;
  occupancyRate: number;
}
