import { planPreferenceSync, type SyncConfirmation } from '@/modules/preferences/sync';
import { type AppPreferences } from '@/modules/preferences/types';

export type AuthSession = {
  userId: string;
  email: string | null;
};

export type AuthFailure =
  'unconfigured' | 'invalid-email' | 'invalid-password' | 'rejected' | 'not-signed-in';

export type AuthGateway = {
  configured: boolean;
  signInWithPassword(email: string, password: string): Promise<AuthSession>;
  requestPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  readPreferences(userId: string): Promise<unknown>;
  writePreferences(userId: string, preferences: AppPreferences): Promise<void>;
};

export type AuthResult<T> =
  { ok: true; value: T } | { ok: false; reason: AuthFailure | 'confirmation-required' };

const EMAIL = /^[^\s@]+@[^\s@]+$/;

export async function signIn(
  gateway: AuthGateway,
  email: string,
  password: string,
): Promise<AuthResult<AuthSession>> {
  if (!gateway.configured) {
    return { ok: false, reason: 'unconfigured' };
  }
  if (!EMAIL.test(email.trim())) {
    return { ok: false, reason: 'invalid-email' };
  }
  if (password.length < 8) {
    return { ok: false, reason: 'invalid-password' };
  }
  try {
    const value = await gateway.signInWithPassword(email.trim(), password);
    return { ok: true, value };
  } catch {
    return { ok: false, reason: 'rejected' };
  }
}

export async function requestAccountRecovery(
  gateway: AuthGateway,
  email: string,
): Promise<AuthResult<true>> {
  if (!gateway.configured) {
    return { ok: false, reason: 'unconfigured' };
  }
  if (!EMAIL.test(email.trim())) {
    return { ok: false, reason: 'invalid-email' };
  }
  try {
    await gateway.requestPasswordReset(email.trim());
    return { ok: true, value: true };
  } catch {
    return { ok: false, reason: 'rejected' };
  }
}

export async function signOut(gateway: AuthGateway): Promise<AuthResult<true>> {
  if (!gateway.configured) {
    return { ok: false, reason: 'unconfigured' };
  }
  await gateway.signOut();
  return { ok: true, value: true };
}

export async function deleteSignedInAccount(
  gateway: AuthGateway,
  confirmation: { understood: boolean; clearDevice: boolean },
): Promise<AuthResult<{ clearDevice: boolean }>> {
  if (!confirmation.understood) {
    return { ok: false, reason: 'confirmation-required' };
  }
  const session = gateway.configured ? await gateway.getSession() : null;
  if (!session) {
    return { ok: false, reason: 'not-signed-in' };
  }
  await gateway.deleteAccount();
  await gateway.signOut();
  return { ok: true, value: { clearDevice: confirmation.clearDevice } };
}

export async function syncSignedInPreferences(
  gateway: AuthGateway,
  local: unknown,
  confirmation: SyncConfirmation,
): Promise<AuthResult<AppPreferences>> {
  const session = gateway.configured ? await gateway.getSession() : null;
  if (!session) {
    return { ok: false, reason: 'not-signed-in' };
  }
  const account = await gateway.readPreferences(session.userId);
  const plan = planPreferenceSync(local, account, confirmation, true);
  if (!plan.ok) {
    return plan;
  }
  if (plan.upload) {
    await gateway.writePreferences(session.userId, plan.upload);
  }
  return { ok: true, value: plan.local };
}
