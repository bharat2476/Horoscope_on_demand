export type AnalyticsEvent =
  | { name: 'locale_changed'; properties: { locale: string } }
  | { name: 'rashi_preference_changed'; properties: { selected: boolean } }
  | { name: 'city_preference_changed'; properties: { selected: boolean } };

export interface AnalyticsClient {
  track(event: AnalyticsEvent): void;
}

/** No vendor is selected. This implementation does not leave the device. */
export const noopAnalytics: AnalyticsClient = {
  track() {},
};
