export {
  deleteSignedInAccount,
  requestAccountRecovery,
  signIn,
  signOut,
  syncSignedInPreferences,
  type AuthFailure,
  type AuthGateway,
  type AuthResult,
  type AuthSession,
} from '@/modules/authentication/actions';
export { getSupabaseClient } from '@/modules/authentication/client';
export {
  createMemorySessionStore,
  memorySessionStore,
} from '@/modules/authentication/session-store';
export { createSupabaseAuthGateway } from '@/modules/authentication/supabase-gateway';
export {
  getAuthAvailability,
  parseSupabasePublicConfig,
  readSupabasePublicConfig,
  type AuthAvailability,
  type SupabasePublicConfig,
} from '@/modules/authentication/config';
