import type { PermitHolder, PermitType, VehicleClass } from '@/lib/types';
import { PLATE_POOL } from '@/lib/constants';

interface HolderSeed {
  name: string;
  company: string;
  permitType: PermitType;
  vehicle: string;
  vehicleClass: VehicleClass;
  assignedBay?: string;
  validThrough: string;
}

const HOLDER_SEEDS: HolderSeed[] = [
  {
    name: 'Dana Whitfield',
    company: 'Vertex Analytics · Fl 12',
    permitType: 'executive',
    vehicle: 'Tesla Model Y',
    vehicleClass: 'ev',
    assignedBay: 'L3-G01',
    validThrough: '2027-03-31',
  },
  {
    name: 'Sofia Lindqvist',
    company: 'Calloway & Roth LLP · Fl 9',
    permitType: 'executive',
    vehicle: 'Polestar 2',
    vehicleClass: 'ev',
    assignedBay: 'L3-G02',
    validThrough: '2027-06-30',
  },
  {
    name: 'Marcus Vance',
    company: 'Nimbus Health · Fl 14',
    permitType: 'executive',
    vehicle: 'BMW 740i',
    vehicleClass: 'sedan',
    assignedBay: 'L3-G03',
    validThrough: '2027-01-15',
  },
  {
    name: 'Omar Haddad',
    company: 'Vertex Analytics · Fl 12',
    permitType: 'annual',
    vehicle: 'BMW 530e',
    vehicleClass: 'sedan',
    assignedBay: 'L2-C01',
    validThrough: '2026-12-31',
  },
  {
    name: 'Priya Raman',
    company: 'Nimbus Health · Fl 14',
    permitType: 'annual',
    vehicle: 'Rivian R1S',
    vehicleClass: 'suv',
    assignedBay: 'L2-C04',
    validThrough: '2026-12-31',
  },
  {
    name: 'Ruth Okonkwo',
    company: 'Delta Robotics · Fl 7',
    permitType: 'annual',
    vehicle: 'Audi e-tron',
    vehicleClass: 'ev',
    assignedBay: 'L2-C07',
    validThrough: '2027-01-15',
  },
  {
    name: 'Ines Duarte',
    company: 'Kestrel Media · Fl 3',
    permitType: 'annual',
    vehicle: 'Volvo XC40 Recharge',
    vehicleClass: 'ev',
    assignedBay: 'L2-C10',
    validThrough: '2026-11-30',
  },
  {
    name: 'Cole Barrett',
    company: 'Elevate Mechanical',
    permitType: 'contractor',
    vehicle: 'Ford F-150',
    vehicleClass: 'pickup',
    validThrough: '2026-09-01',
  },
  {
    name: 'Hank Morrow',
    company: 'Elevate Mechanical',
    permitType: 'contractor',
    vehicle: 'Ram ProMaster',
    vehicleClass: 'van',
    validThrough: '2026-09-30',
  },
  {
    name: 'Jun Sato',
    company: 'Skyline Glazing',
    permitType: 'contractor',
    vehicle: 'Chevy Silverado',
    vehicleClass: 'pickup',
    validThrough: '2026-10-15',
  },
  {
    name: 'Alan Prescott',
    company: 'Meridian Property Group',
    permitType: 'monthly',
    vehicle: 'Lexus ES 350',
    vehicleClass: 'sedan',
    assignedBay: 'L2-D01',
    validThrough: '2026-10-02',
  },
  {
    name: 'Bethany Cole',
    company: 'Halcyon Freight · Fl 2',
    permitType: 'monthly',
    vehicle: 'Hyundai Tucson',
    vehicleClass: 'suv',
    assignedBay: 'L2-D04',
    validThrough: '2026-09-28',
  },
  {
    name: 'Victor Osei',
    company: 'Building Operations',
    permitType: 'monthly',
    vehicle: 'Ford Transit Connect',
    vehicleClass: 'van',
    assignedBay: 'L2-D07',
    validThrough: '2026-12-31',
  },
  {
    name: 'Lena Fischer',
    company: 'Delta Robotics · Fl 7',
    permitType: 'monthly',
    vehicle: 'Mazda CX-5',
    vehicleClass: 'suv',
    assignedBay: 'L2-D10',
    validThrough: '2026-10-31',
  },
  {
    name: 'Tobias Grant',
    company: 'Kestrel Media · Fl 3',
    permitType: 'monthly',
    vehicle: 'VW Golf GTI',
    vehicleClass: 'sedan',
    validThrough: '2026-11-15',
  },
  {
    name: 'Amara Diallo',
    company: 'Vertex Analytics · Fl 12',
    permitType: 'monthly',
    vehicle: 'Toyota Camry Hybrid',
    vehicleClass: 'sedan',
    validThrough: '2026-12-31',
  },
  {
    name: 'Felix Grant',
    company: 'Meridian Property Group',
    permitType: 'valet',
    vehicle: 'Chevy Bolt EUV',
    vehicleClass: 'ev',
    validThrough: '2026-11-30',
  },
  {
    name: 'Rosa Delgado',
    company: 'Meridian Property Group',
    permitType: 'valet',
    vehicle: 'Kia Niro EV',
    vehicleClass: 'ev',
    validThrough: '2026-12-15',
  },
  {
    name: 'Ken Watanabe',
    company: 'Hourly Parker (converted)',
    permitType: 'overflow',
    vehicle: 'Subaru Outback',
    vehicleClass: 'suv',
    validThrough: '2026-09-30',
  },
  {
    name: 'Nadia Rahimi',
    company: 'Calloway & Roth LLP · Fl 9',
    permitType: 'overflow',
    vehicle: 'Honda Accord',
    vehicleClass: 'sedan',
    validThrough: '2026-10-31',
  },
];

export function generatePermitHolders(): PermitHolder[] {
  return HOLDER_SEEDS.map((seed, index) => ({
    id: `PH-${String(index + 1).padStart(3, '0')}`,
    name: seed.name,
    company: seed.company,
    permitType: seed.permitType,
    plate: PLATE_POOL[index] ?? 'UNKNOWN',
    vehicle: seed.vehicle,
    vehicleClass: seed.vehicleClass,
    assignedBay: seed.assignedBay,
    validThrough: seed.validThrough,
  }));
}
