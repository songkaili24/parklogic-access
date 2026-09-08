import type { EvPricing, GateId, PermitType, VehicleClass } from '@/lib/types';

export const PROPERTIES = [
  {
    id: 'meridian-tower',
    name: 'Meridian Tower — Levels L1–L3',
    shortName: 'Meridian Tower',
    levels: 3,
    totalSpots: 120,
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
  'Halcyon Freight (Fl 2)',
  'Building Operations',
] as const;

export const PERMIT_TYPE_LABELS: Record<PermitType, string> = {
  monthly: 'Monthly',
  annual: 'Annual',
  executive: 'Executive',
  overflow: 'Overflow',
  contractor: 'Contractor',
  valet: 'Valet',
};

export const VEHICLE_CLASS_LABELS: Record<VehicleClass, string> = {
  sedan: 'Sedan',
  suv: 'SUV',
  pickup: 'Pickup',
  van: 'Van',
  ev: 'EV',
  motorcycle: 'Motorcycle',
};

export const GATES: GateId[] = ['P1 Entry', 'P1 Exit', 'P2 Entry', 'P2 Exit', 'Commercial Dock'];

export const EV_PRICING_DEFAULTS: EvPricing = {
  l2PerKwh: 0.32,
  dcfcPerKwh: 0.49,
  sessionFee: 1.5,
  idlePerMin: 0.1,
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

/** Typical weekday occupancy profile, used for peak-hour prediction. */
export const HOURLY_OCCUPANCY_PROFILE: Array<{ hour: string; pct: number }> = [
  { hour: '05', pct: 14 },
  { hour: '06', pct: 31 },
  { hour: '07', pct: 58 },
  { hour: '08', pct: 82 },
  { hour: '09', pct: 93 },
  { hour: '10', pct: 96 },
  { hour: '11', pct: 91 },
  { hour: '12', pct: 88 },
  { hour: '13', pct: 90 },
  { hour: '14', pct: 84 },
  { hour: '15', pct: 71 },
  { hour: '16', pct: 55 },
  { hour: '17', pct: 38 },
  { hour: '18', pct: 22 },
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
  '2QFT771',
  '8MJP303',
  'WZX-9418',
  'TRQ-2276',
  '6KDY550',
  '4PXM882',
  '7HGD119',
  'NJK-8841',
  '2VRB637',
  'MKT-1102',
  'KPR-7714',
  '4GHZ092',
  '9WLT335',
  'XXT-9087',
  'QLB-2248',
  'JDY-5013',
];
