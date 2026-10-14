import { type AppEnvironment } from '@/modules/release/environment';
import { type AdChoice, type AgeBand } from '@/modules/growth/metrics';

/** Live publisher ads stay off until a later approval. */
export const LIVE_ADS_APPROVED: boolean = false;

/** Google's published demo ids. They are not a publisher account. */
export const DEMO_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
export const DEMO_BANNER_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111';

export type AdRequest =
  | { status: 'unavailable'; reason: 'placement' | 'live-ads-not-approved' | 'age' | 'consent' | 'consent-form-not-configured' }
  | { status: 'test'; appId: typeof DEMO_ANDROID_APP_ID; unitId: typeof DEMO_BANNER_UNIT_ID; personalized: false };

/**
 * Selects a demo banner or no ad. It never returns a publisher unit id.
 * The result is not a click and does not load a creative by itself.
 */
export function resolveAdRequest(input: {
  environment: AppEnvironment;
  ageBand: AgeBand;
  adChoice: AdChoice;
  placement: string;
}): AdRequest {
  if (input.placement !== 'content-break') {
    return { status: 'unavailable', reason: 'placement' };
  }
  if (input.environment === 'production' && LIVE_ADS_APPROVED !== true) {
    return { status: 'unavailable', reason: 'live-ads-not-approved' };
  }
  if (input.ageBand !== '18-plus') {
    return { status: 'unavailable', reason: 'age' };
  }
  if (input.adChoice === 'unset' || input.adChoice === 'declined') {
    return { status: 'unavailable', reason: 'consent' };
  }
  if (input.adChoice === 'personalized') {
    return { status: 'unavailable', reason: 'consent-form-not-configured' };
  }
  return {
    status: 'test',
    appId: DEMO_ANDROID_APP_ID,
    unitId: DEMO_BANNER_UNIT_ID,
    personalized: false,
  };
}
