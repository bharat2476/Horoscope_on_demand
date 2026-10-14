import { isRashiId } from '@/modules/horoscope';
import { isAppLocale } from '@/modules/localization';

export type ContentKind = 'horoscope' | 'panchang' | 'ritual' | 'temple' | 'festival' | 'video';

export type AnalyticsEvent =
  | { name: 'locale_changed'; properties: { locale: string } }
  | { name: 'rashi_preference_changed'; properties: { rashiId: string } }
  | { name: 'city_preference_changed'; properties: { selected: boolean } }
  | { name: 'tradition_preference_changed'; properties: { selected: boolean } }
  | { name: 'notification_preference_changed'; properties: { channel: string; selected: boolean } }
  | { name: 'first_launch'; properties: { on: string } }
  | { name: 'onboarding_completed'; properties: { completed: true } }
  | { name: 'activity_day'; properties: { on: string } }
  | { name: 'content_viewed'; properties: { kind: ContentKind } }
  | { name: 'content_shared'; properties: { kind: ContentKind } }
  | { name: 'feedback_submitted'; properties: { kind: ContentKind; helpful: boolean } }
  | { name: 'ad_result'; properties: { placement: 'content-break'; filled: boolean; mode: 'test' | 'unavailable' } };

const FORBIDDEN = [
  'birthdate',
  'birthtime',
  'birthplace',
  'latitude',
  'longitude',
  'coordinates',
  'email',
  'traditionid',
  'cityid',
] as const;

const CONTENT_KINDS = new Set<ContentKind>(['horoscope', 'panchang', 'ritual', 'temple', 'festival', 'video']);

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const ANALYTICS_EXPORT_APPROVED: boolean = false;

export function sanitizeAnalyticsPayload(value: unknown): AnalyticsEvent | null {
  if (typeof value !== 'object' || value === null || !('name' in value) || !('properties' in value)) {
    return null;
  }
  const record = value as { name?: unknown; properties?: unknown };
  if (typeof record.name !== 'string' || typeof record.properties !== 'object' || record.properties === null) {
    return null;
  }
  const properties = record.properties as Record<string, unknown>;
  for (const key of Object.keys(properties)) {
    if (FORBIDDEN.includes(key.toLowerCase() as (typeof FORBIDDEN)[number])) {
      return null;
    }
  }
  if (record.name === 'locale_changed' && (properties.locale === 'system' || isAppLocale(properties.locale))) {
    return { name: 'locale_changed', properties: { locale: properties.locale } };
  }
  if (record.name === 'rashi_preference_changed') {
    const rashiId = properties.rashiId === 'none' || isRashiId(properties.rashiId) ? properties.rashiId : null;
    return rashiId ? { name: 'rashi_preference_changed', properties: { rashiId } } : null;
  }
  if (record.name === 'city_preference_changed' && typeof properties.selected === 'boolean') {
    return { name: 'city_preference_changed', properties: { selected: properties.selected } };
  }
  if (record.name === 'tradition_preference_changed' && typeof properties.selected === 'boolean') {
    return { name: 'tradition_preference_changed', properties: { selected: properties.selected } };
  }
  if (
    record.name === 'notification_preference_changed' &&
    typeof properties.channel === 'string' &&
    typeof properties.selected === 'boolean'
  ) {
    return {
      name: 'notification_preference_changed',
      properties: { channel: properties.channel, selected: properties.selected },
    };
  }
  if ((record.name === 'first_launch' || record.name === 'activity_day') && typeof properties.on === 'string' && DATE.test(properties.on)) {
    return { name: record.name, properties: { on: properties.on } };
  }
  if (record.name === 'onboarding_completed' && properties.completed === true) {
    return { name: 'onboarding_completed', properties: { completed: true } };
  }
  if (record.name === 'content_viewed' || record.name === 'content_shared') {
    if (!CONTENT_KINDS.has(properties.kind as ContentKind)) {
      return null;
    }
    return { name: record.name, properties: { kind: properties.kind as ContentKind } };
  }
  if (record.name === 'feedback_submitted' && CONTENT_KINDS.has(properties.kind as ContentKind) && typeof properties.helpful === 'boolean') {
    return {
      name: 'feedback_submitted',
      properties: { kind: properties.kind as ContentKind, helpful: properties.helpful },
    };
  }
  if (
    record.name === 'ad_result' &&
    properties.placement === 'content-break' &&
    typeof properties.filled === 'boolean' &&
    (properties.mode === 'test' || properties.mode === 'unavailable')
  ) {
    return {
      name: 'ad_result',
      properties: { placement: 'content-break', filled: properties.filled, mode: properties.mode },
    };
  }
  return null;
}

export interface AnalyticsClient {
  track(event: AnalyticsEvent): void;
}

/** No vendor is selected. Accepted events stay on the device. */
export const noopAnalytics: AnalyticsClient = {
  track(event) {
    sanitizeAnalyticsPayload(event);
  },
};

export function exportAnalytics(): 'not-approved' {
  return ANALYTICS_EXPORT_APPROVED ? 'not-approved' : 'not-approved';
}
