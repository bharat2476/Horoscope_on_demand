/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const sql = readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20261014140000_private_preferences.sql'),
  'utf8',
);

const checks = readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20261014160000_private_preferences_checks.sql'),
  'utf8',
);

const clientSource = readFileSync(
  path.join(process.cwd(), 'src/modules/authentication/client.ts'),
  'utf8',
);

const layoutSource = readFileSync(path.join(process.cwd(), 'src/app/_layout.tsx'), 'utf8');

describe('private preference policies', () => {
  it('limits preference rows to the signed-in user and deletes that personal data', () => {
    expect(sql).toContain('enable row level security');
    expect(sql).toContain('user_id = auth.uid()');
    expect(sql).toContain('revoke all on public.private_preferences from public, anon');
    expect(sql).toContain('grant execute on function public.delete_own_account() to authenticated');
    expect(sql).toContain('revoke all on function public.delete_own_account() from public, anon');
    expect(sql).toContain('delete from public.private_preferences where user_id = actor');
    expect(sql).toContain('delete from auth.users where id = actor');
    expect(sql).not.toContain('birth');
    expect(sql).not.toContain('latitude');
    expect(checks).toContain('private_preferences_notifications_shape_check');
    expect(checks).toContain("notifications ->> 'delivery' = 'off'");
    expect(checks).toContain('revoke all on table public.private_preferences from service_role');
    expect(checks).not.toContain('latitude');
  });

  it('keeps the service-role key and notification permission out of the client', () => {
    expect(clientSource).not.toContain('SERVICE_ROLE');
    expect(clientSource).not.toMatch(/async-storage/);
    expect(clientSource).toContain('memorySessionStore');
    expect(layoutSource).not.toContain('expo-notifications');
    expect(layoutSource).not.toContain('requestPermissions');
  });
});
