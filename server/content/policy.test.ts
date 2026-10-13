/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const sql = readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20261014120000_content_review.sql'),
  'utf8',
);

describe('content review migration', () => {
  it('lets the public read published rows and withholds workflow writes', () => {
    expect(sql).toContain('enable row level security');
    expect(sql).toContain("status = 'published'");
    expect(sql).toContain('direct writes are not allowed');
    expect(sql).toContain('editor session required');
    expect(sql).toContain('self-approval');
    expect(sql).toContain('missing permission');
    expect(sql).toContain(
      'grant execute on function content.create_document(text, jsonb, timestamptz) to content_staff',
    );
    expect(sql).toContain(
      'grant execute on function content.apply_action(uuid, text, jsonb, text, timestamptz) to content_staff',
    );
    expect(sql).toContain(
      'revoke all on function content.apply_action(uuid, text, jsonb, text, timestamptz) from public, anon, authenticated, service_role',
    );
    expect(sql).toContain('from public, anon, authenticated, service_role, content_staff');
    expect(sql).toContain(
      'grant select on table public.published_rituals, public.published_festivals, public.published_temples',
    );
    expect(sql).not.toMatch(/insert into content\.documents[\s\S]*values\s*\(\s*'/i);
  });

  it('blocks uncleared reuse, guessed festival dates, and photos without permission', () => {
    expect(sql).toContain('financial success');
    expect(sql).toContain('uncleared source');
    expect(sql).toContain('this database does not guess one');
    expect(sql).toContain('permission not granted');
    expect(sql).toContain("permission = 'contributor-granted'");
  });
});
