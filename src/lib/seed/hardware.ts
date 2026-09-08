import type { HardwareDevice } from '@/lib/types';
import { uid } from '@/lib/utils';

const DAY = 86_400_000;
const HR = 3_600_000;

export function generateDevices(): HardwareDevice[] {
  const now = Date.now();
  return [
    {
      id: 'GW-P1-01',
      name: 'Gate controller — P1 Entry',
      kind: 'gate_controller',
      location: 'P1 entry lane',
      status: 'online',
      firmware: '2.4.1',
      uptimePct: 99.98,
      lastMaintenanceAt: now - 12 * DAY,
    },
    {
      id: 'GW-P2-01',
      name: 'Gate controller — P2 Entry',
      kind: 'gate_controller',
      location: 'P2 entry lane',
      status: 'online',
      firmware: '2.4.1',
      uptimePct: 99.95,
      lastMaintenanceAt: now - 12 * DAY,
    },
    {
      id: 'ANPR-P1-01',
      name: 'ANPR camera — P1',
      kind: 'anpr_camera',
      location: 'P1 entry gantry',
      status: 'online',
      firmware: '5.0.3',
      uptimePct: 99.91,
      lastMaintenanceAt: now - 20 * DAY,
    },
    {
      id: 'ANPR-P2-01',
      name: 'ANPR camera — P2',
      kind: 'anpr_camera',
      location: 'P2 entry gantry',
      status: 'degraded',
      firmware: '5.0.3',
      uptimePct: 98.4,
      lastMaintenanceAt: now - 41 * DAY,
      lastError: {
        at: now - 3 * HR,
        message: 'Lens contamination — read confidence down to 82%',
      },
      note: 'Scheduled lens cleaning',
    },
    {
      id: 'SNH-L1-01',
      name: 'Bay sensor hub — L1',
      kind: 'sensor_hub',
      location: 'L1 riser closet',
      status: 'online',
      firmware: '1.9.0',
      uptimePct: 99.99,
      lastMaintenanceAt: now - 33 * DAY,
    },
    {
      id: 'SNH-L2-01',
      name: 'Bay sensor hub — L2',
      kind: 'sensor_hub',
      location: 'L2 riser closet',
      status: 'maintenance',
      firmware: '1.9.0',
      uptimePct: 99.2,
      lastMaintenanceAt: now - 2 * HR,
      lastError: {
        at: now - 26 * HR,
        message: 'Four bay sensors stopped reporting (zone E)',
      },
      note: 'Sensor sweep in progress',
    },
    {
      id: 'KSK-FD-01',
      name: 'Kiosk — Front desk',
      kind: 'kiosk',
      location: 'Lobby',
      status: 'online',
      firmware: '3.2.7',
      uptimePct: 99.87,
      lastMaintenanceAt: now - 9 * DAY,
    },
    {
      id: 'KSK-GP-01',
      name: 'Pay station — Garage exit',
      kind: 'pay_station',
      location: 'P2 exit plaza',
      status: 'offline',
      firmware: '3.1.2',
      uptimePct: 96.1,
      lastMaintenanceAt: now - 18 * DAY,
      lastError: {
        at: now - 7 * HR,
        message: 'Bill acceptor jam — cash path blocked',
      },
      note: 'Vendor dispatch requested',
    },
    {
      id: 'EVC-L3-01',
      name: 'EV network controller',
      kind: 'ev_controller',
      location: 'L3 switch room',
      status: 'online',
      firmware: 'OCPP 2.0.1',
      uptimePct: 99.96,
      lastMaintenanceAt: now - 15 * DAY,
    },
    {
      id: 'SIG-EV-01',
      name: 'Wayfinding signage controller',
      kind: 'signage',
      location: 'Ramp L1→L2',
      status: 'degraded',
      firmware: '1.4.0',
      uptimePct: 97.8,
      lastMaintenanceAt: now - 55 * DAY,
      lastError: {
        at: now - 12 * HR,
        message: 'Display panel 2 dead pixels — content clipped',
      },
    },
  ];
}

/** Reboot command template shown in the hardware console. */
export function rebootCommand(deviceId: string): string {
  return `plctl device reboot --id ${deviceId} --wait-health 30s`;
}

export function deviceErrorEvent(
  deviceId: string,
  message: string,
): { id: string; at: number; message: string } {
  return { id: uid('dev-err'), at: Date.now(), message: `${deviceId}: ${message}` };
}
