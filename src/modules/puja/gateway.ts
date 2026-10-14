import { getSupabaseClient } from '@/modules/authentication/client';
import { credentialIsShortLived } from '@/modules/puja/sessions';
import {
  FAMILY_FIELDS,
  type BookingStatus,
  type FamilyDetails,
  type FamilyField,
} from '@/modules/puja/types';

export type PublicServiceView = {
  id: string;
  slug: string;
  title: string;
  description: string;
  preparation: string;
  pricePaise: number;
  currency: 'INR';
  durationMinutes: number;
  languages: string[];
  minAdvanceHours: number;
  requiredFamilyFields: FamilyField[];
};

export type CustomerBookingView = {
  bookingId: string;
  serviceId: string;
  title: string;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  language: string;
  pricePaise: number;
  currency: string;
  preferredUnavailable: boolean;
  assignedPriestName: string | null;
};

export type SessionCredential = {
  token: string;
  expiresAt: string;
  url: string;
  room: string;
  microphoneMuted: boolean;
  recording: false;
};

export type PujaResult<T> = { ok: true; value: T } | { ok: false; reason: string };

export type PujaGateway = {
  configured: boolean;
  signedIn(): Promise<boolean>;
  listServices(): Promise<PublicServiceView[]>;
  listBookings(): Promise<CustomerBookingView[]>;
  createBooking(input: {
    serviceId: string;
    startsAt: string;
    timeZone: string;
    language: string;
    family: FamilyDetails;
  }): Promise<PujaResult<{ bookingId: string; pricePaise: number }>>;
  savePreferredPriest(bookingId: string): Promise<PujaResult<true>>;
  submitReview(input: {
    bookingId: string;
    rating: number;
    feedback: string;
    issues: string[];
  }): Promise<PujaResult<true>>;
  requestSessionCredential(
    bookingId: string,
    nowSeconds: number,
  ): Promise<PujaResult<SessionCredential>>;
};

const REASONS: { includes: string; reason: string }[] = [
  { includes: 'authentication required', reason: 'authentication_required' },
  { includes: 'advance booking required', reason: 'advance_required' },
  { includes: 'service unavailable', reason: 'service_unavailable' },
  { includes: 'language unsupported', reason: 'language_unsupported' },
  { includes: 'missing family field', reason: 'missing_family_field' },
  { includes: 'invalid timezone', reason: 'invalid_timezone' },
  { includes: 'not completed', reason: 'not_completed' },
  { includes: 'edit closed', reason: 'edit_closed' },
  { includes: 'unauthorized', reason: 'unauthorized' },
  { includes: 'not open', reason: 'not_open' },
  { includes: 'invalid transition', reason: 'invalid_transition' },
];

export function mapPujaError(message: string): string {
  const normalized = message.toLowerCase();
  return REASONS.find((item) => normalized.includes(item.includes))?.reason ?? 'rejected';
}

export function createUnconfiguredPujaGateway(): PujaGateway {
  return {
    configured: false,
    async signedIn() {
      return false;
    },
    async listServices() {
      return [];
    },
    async listBookings() {
      return [];
    },
    async createBooking() {
      return { ok: false, reason: 'unconfigured' };
    },
    async savePreferredPriest() {
      return { ok: false, reason: 'unconfigured' };
    },
    async submitReview() {
      return { ok: false, reason: 'unconfigured' };
    },
    async requestSessionCredential() {
      return { ok: false, reason: 'video_unconfigured' };
    },
  };
}

type ServiceRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  preparation: string;
  price_paise: number;
  currency: string;
  duration_minutes: number;
  languages: string[] | null;
  min_advance_hours: number;
  required_family_fields: string[] | null;
};

function asFields(values: string[] | null): FamilyField[] {
  return (values ?? []).filter((value): value is FamilyField =>
    (FAMILY_FIELDS as readonly string[]).includes(value),
  );
}

function asService(row: ServiceRow): PublicServiceView | null {
  if (row.currency !== 'INR') {
    return null;
  }
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    preparation: row.preparation,
    pricePaise: row.price_paise,
    currency: 'INR',
    durationMinutes: row.duration_minutes,
    languages: row.languages ?? [],
    minAdvanceHours: row.min_advance_hours,
    requiredFamilyFields: asFields(row.required_family_fields),
  };
}

export function readSessionEndpoint(): string | null {
  const value = process.env.EXPO_PUBLIC_PUJA_SESSION_URL?.trim() ?? '';
  return value.length > 0 ? value : null;
}

export function createSupabasePujaGateway(fetchImpl: typeof fetch = fetch): PujaGateway {
  const client = getSupabaseClient();
  if (!client) {
    return createUnconfiguredPujaGateway();
  }
  return {
    configured: true,
    async signedIn() {
      const { data } = await client.auth.getSession();
      return Boolean(data.session?.user);
    },
    async listServices() {
      const { data, error } = await client
        .from('live_puja_services')
        .select(
          'id, slug, title, description, preparation, price_paise, currency, duration_minutes, languages, min_advance_hours, required_family_fields',
        );
      if (error || !data) {
        return [];
      }
      return (data as ServiceRow[]).flatMap((row) => {
        const service = asService(row);
        return service ? [service] : [];
      });
    },
    async listBookings() {
      const { data, error } = await client.rpc('puja_my_bookings');
      if (error || !Array.isArray(data)) {
        return [];
      }
      return data as CustomerBookingView[];
    },
    async createBooking(input) {
      const { data, error } = await client.rpc('puja_create_booking', {
        service_id: input.serviceId,
        starts_at: input.startsAt,
        time_zone: input.timeZone,
        language: input.language,
        family: input.family,
      });
      if (error || !data || typeof data !== 'object') {
        return { ok: false, reason: mapPujaError(error?.message ?? 'rejected') };
      }
      const row = data as { bookingId?: string; pricePaise?: number };
      if (!row.bookingId || typeof row.pricePaise !== 'number') {
        return { ok: false, reason: 'rejected' };
      }
      return { ok: true, value: { bookingId: row.bookingId, pricePaise: row.pricePaise } };
    },
    async savePreferredPriest(bookingId) {
      const { error } = await client.rpc('puja_save_preferred_priest', { booking_id: bookingId });
      return error ? { ok: false, reason: mapPujaError(error.message) } : { ok: true, value: true };
    },
    async submitReview(input) {
      const { error } = await client.rpc('puja_submit_review', {
        booking_id: input.bookingId,
        rating: input.rating,
        feedback: input.feedback,
        issues: input.issues,
      });
      return error ? { ok: false, reason: mapPujaError(error.message) } : { ok: true, value: true };
    },
    async requestSessionCredential(bookingId, nowSeconds) {
      const endpoint = readSessionEndpoint();
      const { data, error } = await client.rpc('puja_authorize_session', { booking_id: bookingId });
      if (error || !data) {
        return { ok: false, reason: mapPujaError(error?.message ?? 'unauthorized') };
      }
      if (!endpoint) {
        return { ok: false, reason: 'video_unconfigured' };
      }
      const { data: sessionData } = await client.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        return { ok: false, reason: 'authentication_required' };
      }
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ bookingId }),
      });
      if (!response.ok) {
        return { ok: false, reason: 'unauthorized' };
      }
      const body = (await response.json()) as Partial<SessionCredential>;
      if (
        body.recording !== false ||
        typeof body.token !== 'string' ||
        typeof body.expiresAt !== 'string' ||
        typeof body.url !== 'string' ||
        !credentialIsShortLived(body.token, nowSeconds)
      ) {
        return { ok: false, reason: 'rejected' };
      }
      return {
        ok: true,
        value: {
          token: body.token,
          expiresAt: body.expiresAt,
          url: body.url,
          room: typeof body.room === 'string' ? body.room : '',
          microphoneMuted: body.microphoneMuted !== false,
          recording: false,
        },
      };
    },
  };
}

export function createPujaGateway(): PujaGateway {
  return createSupabasePujaGateway();
}
