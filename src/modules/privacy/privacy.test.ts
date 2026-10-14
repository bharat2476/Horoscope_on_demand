import { noopAnalytics, sanitizeAnalyticsPayload, type AnalyticsEvent } from '@/modules/analytics';
import { getSupabaseClient } from '@/modules/authentication';
import {
  deleteSignedInAccount,
  requestAccountRecovery,
  signIn,
  syncSignedInPreferences,
  type AuthGateway,
  type AuthSession,
} from '@/modules/authentication/actions';
import { getFestivalDay } from '@/modules/festivals';
import { getDailyHoroscope } from '@/modules/horoscope';
import { suggestLanguage, translationReview, unreviewedLocales } from '@/modules/localization';
import { getPanchang } from '@/modules/panchang';
import {
  canReadPrivatePreferences,
  canReadPublicContent,
  canWritePrivatePreferences,
  DEFAULT_PREFERENCES,
  notificationPermissionRequest,
  NOTIFICATION_DELIVERY,
  planPreferenceSync,
} from '@/modules/preferences';
import { listReviewedRituals } from '@/modules/rituals';
import { listGujaratMatajiTemples } from '@/modules/temples';

describe('anonymous public access', () => {
  it('reads public modules without a session', () => {
    const actor = { userId: null };
    expect(canReadPublicContent(actor)).toBe(true);
    expect(getSupabaseClient()).toBeNull();
    expect(getDailyHoroscope(null).status).toBe('unavailable');
    expect(
      getPanchang({
        calendarDate: '2026-10-14',
        latitude: 23,
        longitude: 72,
        timeZone: 'Asia/Kolkata',
      }).status,
    ).toBe('unavailable');
    expect(getFestivalDay('2026-10-14').status).toBe('unavailable');
    expect(listReviewedRituals()).toEqual([]);
    expect(listGujaratMatajiTemples()).toEqual([]);
    expect(canReadPrivatePreferences(actor, 'user-1')).toBe(false);
    expect(canWritePrivatePreferences(actor, 'user-1')).toBe(false);
  });
});

describe('private preferences', () => {
  it('allows only the signed-in owner to read or write a preference row', () => {
    expect(canReadPrivatePreferences({ userId: 'user-1' }, 'user-1')).toBe(true);
    expect(canWritePrivatePreferences({ userId: 'user-1' }, 'user-1')).toBe(true);
    expect(canReadPrivatePreferences({ userId: 'user-2' }, 'user-1')).toBe(false);
    expect(canWritePrivatePreferences({ userId: 'user-2' }, 'user-1')).toBe(false);
  });

  it('does not upload device settings until the person confirms', () => {
    const poisoned = {
      ...DEFAULT_PREFERENCES,
      locale: 'hi' as const,
      birthDate: '2000-01-01',
      latitude: 23.03,
      longitude: 72.58,
    };
    expect(
      planPreferenceSync(
        poisoned,
        null,
        { understood: false, choice: 'copy-this-device-to-account' },
        true,
      ),
    ).toEqual({ ok: false, reason: 'confirmation-required' });
    const planned = planPreferenceSync(
      poisoned,
      null,
      { understood: true, choice: 'copy-this-device-to-account' },
      true,
    );
    expect(planned.ok).toBe(true);
    if (!planned.ok || !planned.upload) {
      return;
    }
    expect(planned.upload.locale).toBe('hi');
    expect(Object.keys(planned.upload).sort()).toEqual([
      'cityId',
      'locale',
      'notifications',
      'rashiId',
      'traditionId',
    ]);
    expect(JSON.stringify(planned.upload)).not.toContain('birthDate');
    expect(JSON.stringify(planned.upload)).not.toContain('latitude');
  });
});

describe('optional authentication', () => {
  const session: AuthSession = { userId: 'user-1', email: 'person@example.com' };

  function gateway(overrides: Partial<AuthGateway> = {}): AuthGateway & { uploads: unknown[] } {
    const uploads: unknown[] = [];
    return {
      configured: true,
      uploads,
      signInWithPassword: async () => session,
      requestPasswordReset: async () => undefined,
      signOut: async () => undefined,
      deleteAccount: async () => undefined,
      getSession: async () => session,
      readPreferences: async () => null,
      writePreferences: async (_userId, preferences) => {
        uploads.push(preferences);
      },
      ...overrides,
    };
  }

  it('rejects sign-in and recovery when the project is not configured', async () => {
    const offline = gateway({ configured: false });
    expect(await signIn(offline, 'person@example.com', 'long-password')).toEqual({
      ok: false,
      reason: 'unconfigured',
    });
    expect(await requestAccountRecovery(offline, 'person@example.com')).toEqual({
      ok: false,
      reason: 'unconfigured',
    });
  });

  it('signs in with email and password, and sends a recovery message without storing the password', async () => {
    const current = gateway();
    expect(await signIn(current, 'person@example.com', 'short')).toEqual({
      ok: false,
      reason: 'invalid-password',
    });
    expect(await signIn(current, 'person@example.com', 'long-password')).toEqual({
      ok: true,
      value: session,
    });
    expect(await requestAccountRecovery(current, 'person@example.com')).toEqual({
      ok: true,
      value: true,
    });
  });

  it('deletes the account only after confirmation and can leave device settings in place', async () => {
    let deleted = false;
    const current = gateway({
      deleteAccount: async () => {
        deleted = true;
      },
    });
    expect(await deleteSignedInAccount(current, { understood: false, clearDevice: true })).toEqual({
      ok: false,
      reason: 'confirmation-required',
    });
    expect(deleted).toBe(false);
    expect(await deleteSignedInAccount(current, { understood: true, clearDevice: false })).toEqual({
      ok: true,
      value: { clearDevice: false },
    });
    expect(deleted).toBe(true);
  });

  it('writes the account row only for the confirmed copy', async () => {
    const current = gateway();
    const denied = await syncSignedInPreferences(current, DEFAULT_PREFERENCES, {
      understood: false,
      choice: 'copy-this-device-to-account',
    });
    expect(denied.ok).toBe(false);
    expect(current.uploads).toEqual([]);
    const copied = await syncSignedInPreferences(
      current,
      { ...DEFAULT_PREFERENCES, locale: 'ta' },
      { understood: true, choice: 'copy-this-device-to-account' },
    );
    expect(copied.ok).toBe(true);
    expect(current.uploads).toEqual([{ ...DEFAULT_PREFERENCES, locale: 'ta' }]);
  });
});

describe('language, analytics, and notifications', () => {
  it('suggests a phone language and does not treat city as an input', () => {
    expect(suggestLanguage.length).toBe(1);
    expect(suggestLanguage('hi-IN')).toBe('hi');
    expect(suggestLanguage('fr')).toBeNull();
    expect(translationReview('en')).toBe('source');
    expect(unreviewedLocales()).not.toContain('en');
    expect(translationReview('hi')).toBe('draft');
  });

  it('keeps analytics free of birth details, coordinates, and notification delivery off', () => {
    const events: AnalyticsEvent[] = [
      { name: 'locale_changed', properties: { locale: 'ta' } },
      { name: 'rashi_preference_changed', properties: { rashiId: 'mesha' } },
      { name: 'city_preference_changed', properties: { selected: true } },
      { name: 'notification_preference_changed', properties: { channel: 'horoscope', selected: false } },
      { name: 'ad_result', properties: { placement: 'content-break', filled: false, mode: 'unavailable' } },
    ];
    for (const event of events) {
      noopAnalytics.track(event);
      expect(sanitizeAnalyticsPayload(event)).toEqual(event);
    }
    expect(
      sanitizeAnalyticsPayload({
        name: 'content_viewed',
        properties: { kind: 'horoscope', birthDate: '2000-01-01', latitude: 23.03, email: 'a@b.c' },
      }),
    ).toBeNull();
    expect(NOTIFICATION_DELIVERY).toBe('off');
    expect(notificationPermissionRequest()).toBe('not-requested');
  });
});
