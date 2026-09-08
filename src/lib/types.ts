/** Core domain model for ParkLogic operations. */

export type SpotStatus = 'available' | 'occupied' | 'reserved' | 'charging' | 'offline';

export type SpotType = 'standard' | 'accessible' | 'ev' | 'visitor' | 'compact' | 'motorcycle';

export type PermitType = 'executive' | 'tenant' | 'contractor' | 'visitor' | 'valet';

export type ConnectionStatus = 'connecting' | 'connected' | 'syncing' | 'offline';

export interface ParkingSpot {
  /** Lot-style identifier, e.g. "L2-C14" (level, zone, position). */
  id: string;
  level: string;
  zone: string;
  status: SpotStatus;
  type: SpotType;
  permit?: PermitType;
  plate?: string;
  occupiedSince?: number;
  updatedAt: number;
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
  | 'allocation';

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
  hostTenant: string;
  plate: string;
  level: string;
  spot: string;
  validFrom: number;
  validUntil: number;
  status: VisitorPassStatus;
}

export interface ChargingStation {
  id: string;
  level: string;
  zone: string;
  network: 'AC Level 2' | 'DC Fast Charge';
  powerKw: number;
  ports: number;
  portsInUse: number;
  status: 'online' | 'degraded' | 'offline';
  loadShed: boolean;
}

export interface Property {
  id: string;
  name: string;
  shortName: string;
  levels: number;
  totalSpots: number;
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
