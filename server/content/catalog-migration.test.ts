/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const catalog = readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20261015210000_public_catalog_cache.sql'),
  'utf8',
);
const preferences = readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20261014140000_private_preferences.sql'),
  'utf8',
);
const querySource = readFileSync(path.join(process.cwd(), 'src/modules/backend/query.ts'), 'utf8');
const config = readFileSync(
  path.join(process.cwd(), 'src/modules/authentication/config.ts'),
  'utf8',
);
const example = readFileSync(path.join(process.cwd(), '.env.example'), 'utf8');
const content = readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20261014120000_content_review.sql'),
  'utf8',
);

describe('public catalog migration', () => {
  it('lets anonymous clients read published views and withholds writes', () => {
    expect(catalog).toContain('enable row level security');
    expect(catalog).toContain('content.block_direct_write');
    expect(catalog).toContain('grant select on table public.rashis to anon, authenticated');
    expect(catalog).toContain(
      'grant select on table public.panchang_cache_public to anon, authenticated',
    );
    expect(catalog).toContain(
      'grant select on table public.published_content_editions to anon, authenticated',
    );
    expect(catalog).toContain('grant execute on function content.upsert_panchang_cache');
    expect(catalog).toContain('to content_staff');
    expect(catalog).toContain('missing permission');
    expect(catalog).toContain('editor session required');
    expect(catalog).toContain('revoke all on function content.upsert_panchang_cache');
    expect(catalog).toContain('from public, anon, authenticated, service_role');
    expect(catalog).toContain("where status = 'published'");
    expect(catalog).toContain('license_allows_cache = true');
    expect(catalog).not.toMatch(/drop table|truncate|delete from/i);
    expect(catalog).not.toMatch(/insert into content\.(documents|daily_readings)/i);
  });

  it('keeps preference rows and reviewer workflow away from anonymous clients', () => {
    expect(preferences).toContain('user_id = auth.uid()');
    expect(preferences).toContain('revoke all on public.private_preferences from public, anon');
    expect(preferences).not.toContain('to anon');
    expect(content).toContain('grant execute on function content.apply_action');
    expect(content).toContain('to content_staff');
    expect(content).toContain(
      'revoke all on function content.apply_action(uuid, text, jsonb, text, timestamptz) from public, anon, authenticated, service_role',
    );
    expect(config).toContain('EXPO_PUBLIC_SUPABASE_URL');
    expect(config).toContain('EXPO_PUBLIC_SUPABASE_ANON_KEY');
    expect(config).not.toMatch(/process\.env\.[A-Z0-9_]*SERVICE_ROLE/);
    expect(example).not.toMatch(/^EXPO_PUBLIC_.*SERVICE_ROLE/m);
    expect(querySource).not.toMatch(/\.insert\(|\.update\(|\.delete\(|\.upsert\(/);
  });
});
