import { type PriestRecord } from '@/modules/puja/types';

export type Viewer = 'anonymous' | 'customer' | 'assigned_priest' | 'admin';

export type PriestExposure = {
  displayName: string | null;
  contactEmail: null;
  contactPhone: null;
  documents: null;
};

/** Customers never receive a priest directory, contact details, or verification documents. */
export function exposePriest(
  viewer: Viewer,
  priest: PriestRecord | null,
  assigned: boolean,
): PriestExposure {
  if (!priest) {
    return { displayName: null, contactEmail: null, contactPhone: null, documents: null };
  }
  const named =
    viewer === 'admin' ||
    (viewer === 'assigned_priest' && assigned) ||
    (viewer === 'customer' && assigned);
  return {
    displayName: named ? priest.displayName : null,
    contactEmail: null,
    contactPhone: null,
    documents: null,
  };
}

export function canReadFamilyDetails(
  viewer: Viewer,
  ownsBooking: boolean,
  assignedPriest: boolean,
): boolean {
  if (viewer === 'admin') {
    return true;
  }
  if (viewer === 'customer') {
    return ownsBooking;
  }
  if (viewer === 'assigned_priest') {
    return assignedPriest;
  }
  return false;
}

export function canBrowsePriestDirectory(): false {
  return false;
}
