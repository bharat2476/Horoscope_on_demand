export type AnalyticsEvent =
  | { name: 'locale_changed'; properties: { locale: string } }
  | { name: 'rashi_preference_changed'; properties: { selected: boolean } }
  | { name: 'city_preference_changed'; properties: { selected: boolean } }
  | { name: 'tradition_preference_changed'; properties: { selected: boolean } }
  | { name: 'notification_preference_changed'; properties: { selected: boolean } };

export const ANALYTICS_PROPERTY_KEYS = ['locale', 'selected'] as const;

export interface AnalyticsClient {
  track(event: AnalyticsEvent): void;
}

/** No vendor is selected. This implementation does not leave the device. */
export const noopAnalytics: AnalyticsClient = {
  track() {},
};
