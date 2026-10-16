/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const edition = readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20261016213000_language_editions.sql'),
  'utf8',
);
const client = readFileSync(
  path.join(process.cwd(), 'src/modules/backend/use-public-read.ts'),
  'utf8',
);

describe('language edition migration', () => {
  it('adds a reviewed edition per language without dropping existing objects', () => {
    expect(edition).toContain('create table content.language_editions');
    expect(edition).toContain('enable row level security');
    expect(edition).toContain('content.block_direct_write');
    expect(edition).toContain(
      "language in ('en', 'hi', 'gu', 'ta', 'ml', 'mr', 'kn', 'te', 'bn', 'pa')",
    );
    expect(edition).toContain('reviewer_id <> created_by');
    expect(edition).toContain("where status = 'published'");
    expect(edition).toContain('grant select on table public.published_ritual_editions');
    expect(edition).toContain('to anon, authenticated');
    expect(edition).toContain('to content_staff');
    expect(edition).toContain(
      'revoke all on content.language_editions from public, anon, authenticated, service_role, content_staff',
    );
    const views = edition.slice(edition.indexOf('create view public.published_ritual_editions'));
    expect(views).not.toMatch(/reviewer_id|review_date/);
    expect(views).not.toMatch(/from content\.revisions/);
    expect(edition).not.toMatch(/drop table|truncate|rename |alter table content\.documents/i);
    expect(edition).not.toMatch(/insert into content\.(documents|daily_readings|panchang_cache)/i);
    expect(views).toContain('published_festival_editions');
    expect(views).toContain('published_ritual_editions');
    expect(views).toContain('published_temple_editions');
    expect(client).toContain('loadPublishedFestivalEditions');
    expect(client).not.toMatch(/service_role|SERVICE_ROLE/);
  });
});
