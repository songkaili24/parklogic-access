import type { ActivityEvent, SystemAlert } from '@/lib/types';
import { uid } from '@/lib/utils';

export function generateInitialEvents(): ActivityEvent[] {
  const base = Date.now();
  const events: Array<[number, ActivityEvent['kind'], string, string, string?]> = [
    [8_000, 'entry', 'ANPR match — gate arm raised at P1 entry', '7KJH221', 'L2-C01'],
    [12_500, 'pass_issued', 'Visitor pass issued to Sarah Chen', 'Front desk', 'L1-A01'],
    [21_000, 'exit', 'Ticket validated — tenant exit at P2', '4TRN890'],
    [34_000, 'charge_started', 'Charging session started on EV-L3-F01', '7KJH221', 'L3-F01'],
    [
      47_000,
      'allocation',
      'Overflow block L1-A06…A10 opened for spill-over',
      'Building Operations',
    ],
    [62_000, 'gate_hold', 'Gate hold — unregistered plate at P1 entry', 'UNKNOWN-441'],
    [75_000, 'entry', 'Contractor check-in — badge 4471', 'HLM-2207', 'L1-B11'],
    [88_000, 'maintenance', 'Work order MT-0041 opened for EV-L3-F08', 'EV Network'],
    [96_000, 'exit', 'ANPR match — exit at P2', '9QWD113'],
    [110_000, 'charge_complete', 'Charging complete — 22.4 kWh delivered', '6ZPB554', 'L3-F03'],
  ];

  return events.map(([offset, kind, message, actor, spot]) => ({
    id: uid('evt'),
    timestamp: base - offset,
    kind,
    message,
    actor,
    spot,
  }));
}

export function generateInitialAlerts(): SystemAlert[] {
  return [
    {
      id: uid('alr'),
      severity: 'critical',
      title: 'Unauthorized vehicle — P1 entry',
      message:
        'Plate UNKNOWN-441 denied twice within 20 minutes at P1 entry. Lane queued; guard dispatch recommended.',
      source: 'Access Control / P1 Entry',
      raisedAt: Date.now() - 9 * 60_000,
      acknowledged: false,
    },
    {
      id: uid('alr'),
      severity: 'warning',
      title: 'Permit expired — Elevate Mechanical',
      message:
        'Cole Barrett (contractor) attempted P2 entry on an expired permit. Renewal outstanding since 2026-09-01.',
      source: 'Permits / ANPR Validation',
      raisedAt: Date.now() - 34 * 60_000,
      acknowledged: false,
    },
    {
      id: uid('alr'),
      severity: 'critical',
      title: 'Charger fault — EV-L3-F08',
      message:
        'Connector latch jam; cable retraction failed. Bay L3-F08 taken offline, ticket MT-0041 opened.',
      source: 'EV Network / OCPP Status Notification',
      raisedAt: Date.now() - 5 * 3_600_000,
      acknowledged: false,
    },
    {
      id: uid('alr'),
      severity: 'info',
      title: 'Overflow block released',
      message: 'L1-A06…A10 opened for spill-over parking ahead of the 10:00 peak.',
      source: 'Allocations',
      raisedAt: Date.now() - 47 * 60_000,
      acknowledged: true,
    },
  ];
}
