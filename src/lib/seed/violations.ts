import type { Violation } from '@/lib/types';
import { PLATE_POOL } from '@/lib/constants';
import { uid } from '@/lib/utils';

const DAY = 86_400_000;

export function generateViolations(): Violation[] {
  const now = Date.now();
  const mk = (
    seq: number,
    plate: string,
    kind: Violation['kind'],
    status: Violation['status'],
    issuedDaysAgo: number,
    fineCents: number,
    issuedBy: string,
    detail: string,
    spot?: string,
    appeal?: Violation['appeal'],
  ): Violation => ({
    id: uid('vio'),
    code: `V-2026-${String(1000 + seq)}`,
    plate,
    spot,
    kind,
    status,
    evidenceRef: `ANPR-${String(seq).padStart(4, '0')}`,
    fineCents,
    issuedAt: now - issuedDaysAgo * DAY - seq * 1_500_000,
    issuedBy,
    detail,
    appeal,
    resolvedAt:
      status === 'upheld' || status === 'dismissed' || status === 'paid'
        ? now - (issuedDaysAgo - 1) * DAY
        : undefined,
  });

  return [
    mk(
      1,
      PLATE_POOL[25] ?? 'XXT-9087',
      'fire_lane',
      'open',
      0.2,
      250_00,
      'ANPR Enforcement',
      'Parked in marked fire lane adjacent to P1 entry for 47 minutes.',
    ),
    mk(
      2,
      PLATE_POOL[10] ?? '8MJP303',
      'unauthorized_parking',
      'contested',
      1,
      75_00,
      'ANPR Enforcement',
      'Vehicle without an active permit occupied tenant bay L2-C07 overnight.',
      'L2-C07',
      {
        submittedAt: now - 0.6 * DAY,
        statement:
          'I was a registered guest of Ruth Okonkwo under visitor pass PL-K4TZ-9MQ2 issued the same afternoon; the pass ledger should confirm the bay assignment.',
        status: 'pending',
      },
    ),
    mk(
      3,
      PLATE_POOL[17] ?? 'JDY-5013',
      'overtime',
      'open',
      0.5,
      45_00,
      'Kiosk Audit',
      'Metered overflow bay exceeded the 4-hour maximum by 2h 10m.',
    ),
    mk(
      4,
      PLATE_POOL[7] ?? 'HLM-2207',
      'expired_permit',
      'upheld',
      3,
      75_00,
      'Permits / ANPR Validation',
      'Contractor permit expired 2026-09-01; vehicle remained parked across two business days.',
      'L1-B09',
      {
        submittedAt: now - 2.4 * DAY,
        statement:
          'The renewal application was submitted on 2026-08-30 and the vendor confirmed payment processing before the expiry date.',
        evidenceFileName: 'renewal-confirmation.pdf',
        status: 'denied',
      },
    ),
    mk(
      5,
      PLATE_POOL[2] ?? 'GDX-4451',
      'improper_use',
      'dismissed',
      2,
      120_00,
      'ANPR Enforcement',
      'Vehicle straddled two bays in visitor zone A during the 10:00 peak.',
      'L1-A07',
      {
        submittedAt: now - 1.7 * DAY,
        statement:
          'The adjacent bay had a coned-off sensor fault at the time; I re-parked as soon as the marshal directed me to an open bay.',
        evidenceFileName: 'coned-bay-photo.jpg',
        status: 'approved',
      },
    ),
    mk(
      6,
      PLATE_POOL[21] ?? 'MKT-1102',
      'unauthorized_parking',
      'paid',
      4,
      75_00,
      'ANPR Enforcement',
      'Vehicle parked in executive zone G without an executive permit.',
      'L3-G06',
    ),
    mk(
      7,
      PLATE_POOL[26] ?? 'QLB-2248',
      'overtime',
      'contested',
      0.8,
      45_00,
      'Kiosk Audit',
      'Overflow bay L1-B14 exceeded the 4-hour maximum by 55 minutes.',
      'L1-B14',
      {
        submittedAt: now - 0.4 * DAY,
        statement:
          'The pay station at P2 exit was offline with a bill acceptor jam, so I could not extend the session before the cutoff.',
        status: 'pending',
      },
    ),
    mk(
      8,
      PLATE_POOL[27] ?? 'JDY-5013',
      'expired_permit',
      'open',
      0.3,
      75_00,
      'Permits / ANPR Validation',
      'Monthly permit for Halcyon Freight lapsed 2026-09-01 — no renewal on file.',
    ),
  ];
}
