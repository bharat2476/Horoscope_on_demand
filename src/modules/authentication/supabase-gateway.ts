import { type AuthGateway, type AuthSession } from '@/modules/authentication/actions';
import { getSupabaseClient } from '@/modules/authentication/client';
import { type AppPreferences } from '@/modules/preferences';

export function createSupabaseAuthGateway(): AuthGateway {
  const client = getSupabaseClient();
  return {
    configured: client !== null,
    async signInWithPassword(email, password) {
      if (!client) {
        throw new Error('unconfigured');
      }
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        throw new Error(error?.message ?? 'rejected');
      }
      return { userId: data.user.id, email: data.user.email ?? null };
    },
    async requestPasswordReset(email) {
      if (!client) {
        throw new Error('unconfigured');
      }
      const { error } = await client.auth.resetPasswordForEmail(email);
      if (error) {
        throw new Error(error.message);
      }
    },
    async signOut() {
      if (!client) {
        return;
      }
      const { error } = await client.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    },
    async deleteAccount() {
      if (!client) {
        throw new Error('unconfigured');
      }
      const { error } = await client.rpc('delete_own_account');
      if (error) {
        throw new Error(error.message);
      }
    },
    async getSession(): Promise<AuthSession | null> {
      if (!client) {
        return null;
      }
      const { data } = await client.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        return null;
      }
      return { userId: user.id, email: user.email ?? null };
    },
    async readPreferences(userId) {
      if (!client) {
        return null;
      }
      const { data, error } = await client
        .from('private_preferences')
        .select('locale, rashi_id, city_id, tradition_id, notifications')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      if (!data) {
        return null;
      }
      return {
        locale: data.locale,
        rashiId: data.rashi_id,
        cityId: data.city_id,
        traditionId: data.tradition_id,
        notifications: data.notifications,
      };
    },
    async writePreferences(userId, preferences: AppPreferences) {
      if (!client) {
        throw new Error('unconfigured');
      }
      const { error } = await client.from('private_preferences').upsert({
        user_id: userId,
        locale: preferences.locale,
        rashi_id: preferences.rashiId,
        city_id: preferences.cityId,
        tradition_id: preferences.traditionId,
        notifications: preferences.notifications,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        throw new Error(error.message);
      }
    },
  };
}
