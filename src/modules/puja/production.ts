export type ProductionEvidence = {
  paymentWebhookVerified: boolean;
  privacyNoticePublished: boolean;
  authorizationTestsPassed: boolean;
  concurrencyTestsPassed: boolean;
  liveVideoDeviceTestPassed: boolean;
};

export const PRODUCTION_GATE_KEYS = [
  'paymentWebhookVerified',
  'privacyNoticePublished',
  'authorizationTestsPassed',
  'concurrencyTestsPassed',
  'liveVideoDeviceTestPassed',
] as const satisfies readonly (keyof ProductionEvidence)[];

/**
 * Automated tests in this repository do not flip this record.
 * A release review has to record each gate after the matching check is actually done.
 */
export function currentProductionEvidence(): ProductionEvidence {
  return {
    paymentWebhookVerified: false,
    privacyNoticePublished: false,
    authorizationTestsPassed: false,
    concurrencyTestsPassed: false,
    liveVideoDeviceTestPassed: false,
  };
}

export function productionGates(evidence: ProductionEvidence): {
  ready: boolean;
  missing: string[];
} {
  const missing = PRODUCTION_GATE_KEYS.filter((key) => !evidence[key]);
  return { ready: missing.length === 0, missing: [...missing] };
}
