import { parsePreferences, type AppPreferences } from '@/modules/preferences/types';

export type SyncChoice = 'keep-this-device' | 'use-account-copy' | 'copy-this-device-to-account';

export type SyncConfirmation = {
  understood: boolean;
  choice: SyncChoice;
};

export type SyncResult =
  | { ok: true; local: AppPreferences; upload: AppPreferences | null }
  | { ok: false; reason: 'confirmation-required' | 'not-signed-in' };

/**
 * Copies preferences only after an explicit confirmation.
 * The payload is parsed first, so birth fields and coordinates cannot ride along.
 */
export function planPreferenceSync(
  local: unknown,
  account: unknown,
  confirmation: SyncConfirmation,
  signedIn: boolean,
): SyncResult {
  if (!confirmation.understood) {
    return { ok: false, reason: 'confirmation-required' };
  }
  if (!signedIn) {
    return { ok: false, reason: 'not-signed-in' };
  }
  const device = parsePreferences(local);
  const remote = account === null ? null : parsePreferences(account);
  if (confirmation.choice === 'keep-this-device') {
    return { ok: true, local: device, upload: null };
  }
  if (confirmation.choice === 'use-account-copy') {
    return { ok: true, local: remote ?? device, upload: null };
  }
  return { ok: true, local: device, upload: device };
}
