import type { ChargingSession, ChargingStation, MaintenanceTicket } from '@/lib/types';
import { uid } from '@/lib/utils';

export function generateStations(): ChargingStation[] {
  return [
    {
      id: 'EV-L3-F01',
      level: 'L3',
      zone: 'F',
      chargerType: 'DC Fast Charge',
      powerKw: 150,
      ports: 1,
      portsInUse: 1,
      status: 'charging',
      kwhToday: 84.2,
    },
    {
      id: 'EV-L3-F02',
      level: 'L3',
      zone: 'F',
      chargerType: 'DC Fast Charge',
      powerKw: 150,
      ports: 1,
      portsInUse: 1,
      status: 'charging',
      kwhToday: 61.7,
    },
    {
      id: 'EV-L3-F03',
      level: 'L3',
      zone: 'F',
      chargerType: 'Level 2',
      powerKw: 11,
      ports: 1,
      portsInUse: 1,
      status: 'charging',
      kwhToday: 18.4,
    },
    {
      id: 'EV-L3-F04',
      level: 'L3',
      zone: 'F',
      chargerType: 'Level 2',
      powerKw: 11,
      ports: 1,
      portsInUse: 0,
      status: 'available',
      kwhToday: 9.1,
    },
    {
      id: 'EV-L3-F05',
      level: 'L3',
      zone: 'F',
      chargerType: 'Level 2',
      powerKw: 11,
      ports: 1,
      portsInUse: 0,
      status: 'available',
      kwhToday: 12.6,
    },
    {
      id: 'EV-L3-F06',
      level: 'L3',
      zone: 'F',
      chargerType: 'Level 2',
      powerKw: 11,
      ports: 1,
      portsInUse: 0,
      status: 'available',
      kwhToday: 7.8,
      note: 'RFID reader intermittent — falls back to app auth',
    },
    {
      id: 'EV-L3-F07',
      level: 'L3',
      zone: 'F',
      chargerType: 'Level 2',
      powerKw: 11,
      ports: 1,
      portsInUse: 0,
      status: 'reserved',
      kwhToday: 4.2,
    },
    {
      id: 'EV-L3-F08',
      level: 'L3',
      zone: 'F',
      chargerType: 'Level 2',
      powerKw: 11,
      ports: 1,
      portsInUse: 0,
      status: 'fault',
      kwhToday: 0,
      note: 'Connector latch jam — cable retraction fault',
    },
  ];
}

const SESSION_USERS = [
  { userName: 'Dana Whitfield', plate: '7KJH221' },
  { userName: 'Sofia Lindqvist', plate: '4TRN890' },
  { userName: 'Felix Grant', plate: '6ZPB554' },
];

export function generateSessions(stations: ChargingStation[]): ChargingSession[] {
  const charging = stations.filter((station) => station.status === 'charging');
  return charging.map((station, index) => {
    const user = SESSION_USERS[index % SESSION_USERS.length]!;
    const isDcfc = station.chargerType === 'DC Fast Charge';
    return {
      id: uid('ses'),
      stationId: station.id,
      port: 1,
      userName: user.userName,
      plate: user.plate,
      startedAt: Date.now() - (25 + index * 40) * 60_000,
      estMinutes: isDcfc ? 40 : 150,
      kwhDelivered: Math.round((6 + index * 4.3) * 10) / 10,
      targetKwh: isDcfc ? 45 : 18,
    };
  });
}

export function generateTickets(): MaintenanceTicket[] {
  return [
    {
      id: 'MT-0041',
      stationId: 'EV-L3-F08',
      openedAt: Date.now() - 5 * 3_600_000,
      severity: 'major',
      summary: 'Connector latch jam — cable retraction fault',
      status: 'open',
    },
    {
      id: 'MT-0039',
      stationId: 'EV-L3-F06',
      openedAt: Date.now() - 27 * 3_600_000,
      severity: 'minor',
      summary: 'RFID reader intermittent — falls back to app auth',
      status: 'in_progress',
    },
  ];
}
