import { type LiveService } from '@/modules/puja/types';

/**
 * Initial administrator configuration used by tests and the database seed.
 * The app does not show these rows unless the booking gateway returns them.
 * Copy describes the booking. It is not a ritual guide.
 */
export const SAMPLE_SERVICES: readonly LiveService[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'havan-homa',
    status: 'published',
    copy: {
      title: 'Havan / Homa',
      description: 'A private fire ritual for one household, conducted live by an assigned priest.',
      preparation:
        'Keep a clean space and the materials confirmed after booking. The app does not list ritual steps.',
    },
    pricePaise: 510000,
    currency: 'INR',
    durationMinutes: 90,
    languages: ['hi', 'en', 'sa'],
    minAdvanceHours: 48,
    requiredFamilyFields: ['householdName'],
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'satyanarayan-katha',
    status: 'published',
    copy: {
      title: 'Satyanarayan Katha',
      description: 'A private Satyanarayan katha for one household.',
      preparation:
        'Keep a quiet place for the household. Preparation details come from the assigned priest after confirmation.',
    },
    pricePaise: 310000,
    currency: 'INR',
    durationMinutes: 120,
    languages: ['hi', 'en'],
    minAdvanceHours: 24,
    requiredFamilyFields: ['householdName'],
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    slug: 'ganesh-puja',
    status: 'published',
    copy: {
      title: 'Ganesh Puja',
      description: 'A private Ganesh puja for one household.',
      preparation:
        'The household joins from one connection. No public or shared session is created.',
    },
    pricePaise: 210000,
    currency: 'INR',
    durationMinutes: 60,
    languages: ['hi', 'en', 'mr'],
    minAdvanceHours: 12,
    requiredFamilyFields: ['householdName'],
  },
];

export function formatInr(pricePaise: number): string {
  const rupees = pricePaise / 100;
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
