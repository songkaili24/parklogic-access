import type { PermitType, Property } from '@/lib/types';

export const PROPERTIES: Property[] = [
  {
    id: 'meridian-tower',
    name: 'Meridian Tower — Levels L1–L3',
    shortName: 'Meridian Tower',
    levels: 3,
    totalSpots: 128,
  },
  {
    id: 'harbor-point',
    name: 'Harbor Point Garage',
    shortName: 'Harbor Point',
    levels: 5,
    totalSpots: 212,
  },
  {
    id: 'innovation-campus',
    name: 'Innovation Campus — Structure B',
    shortName: 'Innovation Campus B',
    levels: 4,
    totalSpots: 340,
  },
];

export const TENANTS = [
  'Vertex Analytics (Fl 12)',
  'Calloway & Roth LLP (Fl 9)',
  'Nimbus Health (Fl 14)',
  'Delta Robotics (Fl 7)',
  'Kestrel Media (Fl 3)',
  'Building Operations',
] as const;

export const PERMIT_TYPE_LABELS: Record<PermitType, string> = {
  executive: 'Executive',
  tenant: 'Tenant',
  contractor: 'Contractor',
  visitor: 'Visitor',
  valet: 'Valet',
};

export interface DurationPreset {
  label: string;
  minutes: number;
}

/** Reservation windows offered at the visitor kiosk. */
export const DURATION_PRESETS: DurationPreset[] = [
  { label: '30 min', minutes: 30 },
  { label: '1 hr', minutes: 60 },
  { label: '2 hr', minutes: 120 },
  { label: '4 hr', minutes: 240 },
  { label: '8 hr', minutes: 480 },
  { label: '12 hr', minutes: 720 },
  { label: '24 hr', minutes: 1440 },
];

/** Mock vehicles used to populate live gate events. */
export const PLATE_POOL = [
  '7KJH221',
  '4TRN890',
  'GDX-4451',
  '9QWD113',
  'HLM-2207',
  '6ZPB554',
  'KTW-8830',
  '3NVR412',
  'BJX-6640',
  '8RFQ731',
  'MDS-1902',
  '5HLK268',
];
