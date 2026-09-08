import type { WaitlistEntry } from '@/lib/types';
import { uid } from '@/lib/utils';

export function generateWaitlist(): WaitlistEntry[] {
  return [
    {
      id: uid('wtl'),
      name: 'Owen Frost',
      company: 'Halcyon Freight · Fl 2',
      permitType: 'monthly',
      plate: '2VRB637',
      vehicle: 'Nissan Rogue',
      position: 1,
      requestedAt: Date.now() - 12 * 86_400_000,
    },
    {
      id: uid('wtl'),
      name: 'Maya Santos',
      company: 'Kestrel Media · Fl 3',
      permitType: 'monthly',
      plate: 'MKT-1102',
      vehicle: 'Hyundai Elantra',
      position: 2,
      requestedAt: Date.now() - 8 * 86_400_000,
    },
    {
      id: uid('wtl'),
      name: 'Julian Beck',
      company: 'Nimbus Health · Fl 14',
      permitType: 'executive',
      plate: '4GHZ092',
      vehicle: 'Genesis G80',
      position: 1,
      requestedAt: Date.now() - 21 * 86_400_000,
    },
    {
      id: uid('wtl'),
      name: 'Harriet Cole',
      company: 'Vertex Analytics · Fl 12',
      permitType: 'annual',
      plate: '9WLT335',
      vehicle: 'Toyota RAV4 Prime',
      position: 1,
      requestedAt: Date.now() - 5 * 86_400_000,
    },
  ];
}
