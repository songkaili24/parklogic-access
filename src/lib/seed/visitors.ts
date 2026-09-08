import type { VisitorPass, VisitorVisit } from '@/lib/types';
import { uid } from '@/lib/utils';

export function generateVisitorPasses(): VisitorPass[] {
  const now = Date.now();
  const hr = 3_600_000;
  return [
    { code: 'PL-K4TZ-9MQ2', guestName: 'Sarah Chen', company: 'Meridian Facade Crew', host: 'Victor Osei', plate: 'GDX-4451', level: 'L1', spot: 'A01', validFrom: now - 45 * 60_000, validUntil: now + 3 * hr, status: 'active' },
    { code: 'PL-VB7X-2HD8', guestName: 'Marcus Webb', company: 'Audit Partners LLC', host: 'Dana Whitfield', plate: 'MDS-1902', level: 'L1', spot: 'A02', validFrom: now - 20 * 60_000, validUntil: now + 90 * 60_000, status: 'active' },
    { code: 'PL-JN3P-6WR5', guestName: 'Elena Ortiz', company: 'Ortiz Legal Support', host: 'Sofia Lindqvist', plate: '6ZPB554', level: 'L1', spot: 'A03', validFrom: now - 60 * 60_000, validUntil: now + 4 * hr, status: 'active' },
    { code: 'PL-RD8S-3KQ7', guestName: 'Tom Ibrahim', company: 'Meridian Facade Crew', host: 'Victor Osei', plate: 'TRQ-2276', level: 'L1', spot: 'A04', validFrom: now + 2 * hr, validUntil: now + 8 * hr, status: 'scheduled' },
    { code: 'PL-WQ2N-8VT4', guestName: 'Grace Liu', company: 'Nimbus Health Clinical', host: 'Priya Raman', plate: 'KPR-7714', level: 'L1', spot: 'A05', validFrom: now + 19 * hr, validUntil: now + 26 * hr, status: 'scheduled' },
  ];
}

export function generateVisitHistory(): VisitorVisit[] {
  const now = Date.now();
  const hr = 3_600_000;
  return [
    { id: uid('vis'), guestName: 'Marcus Webb', company: 'Audit Partners LLC', host: 'Dana Whitfield', plate: 'MDS-1902', checkIn: now - 27 * hr, checkOut: now - 22 * hr },
    { id: uid('vis'), guestName: 'Sarah Chen', company: 'Meridian Facade Crew', host: 'Victor Osei', plate: 'GDX-4451', checkIn: now - 26 * hr, checkOut: now - 18 * hr },
    { id: uid('vis'), guestName: 'Peter Okoye', company: 'Elevate Mechanical', host: 'Building Operations', plate: 'HLM-2207', checkIn: now - 25 * hr, checkOut: now - 19 * hr },
    { id: uid('vis'), guestName: 'Elena Ortiz', company: 'Ortiz Legal Support', host: 'Sofia Lindqvist', plate: '6ZPB554', checkIn: now - 49 * hr, checkOut: now - 43 * hr },
    { id: uid('vis'), guestName: 'Grace Liu', company: 'Nimbus Health Clinical', host: 'Priya Raman', plate: 'KPR-7714', checkIn: now - 50 * hr, checkOut: now - 45 * hr },
    { id: uid('vis'), guestName: 'Tom Ibrahim', company: 'Meridian Facade Crew', host: 'Victor Osei', plate: 'TRQ-2276', checkIn: now - 51 * hr, checkOut: now - 47 * hr },
    { id: uid('vis'), guestName: 'Derek Young', company: 'Vertex Analytics', host: 'Amara Diallo', plate: '4PXM882', checkIn: now - 74 * hr, checkOut: now - 70 * hr },
    { id: uid('vis'), guestName: 'Anna Kowalski', company: 'Skyline Glazing', host: 'Building Operations', plate: 'NJK-8841', checkIn: now - 98 * hr, checkOut: now - 90 * hr },
  ];
}
