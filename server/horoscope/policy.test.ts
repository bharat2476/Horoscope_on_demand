/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const sql = readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20261015120000_daily_rashi.sql'),
  'utf8',
);

describe('daily Rashi migration', () => {
  it('publishes reviewed rows to anonymous readers and stores no sample prediction', () => {
    expect(sql).toContain('enable row level security');
    expect(sql).toContain("'mesha', 'vrishabha', 'mithuna', 'karka', 'simha', 'kanya'");
    expect(sql).toContain("'tula', 'vrishchika', 'dhanu', 'makara', 'kumbha', 'meena'");
    expect(sql).toContain('development_example = false');
    expect(sql).toContain('reviewer_id <> created_by');
    expect(sql).toContain('content.block_direct_write');
    expect(sql).toContain('grant select on table public.published_daily_rashis to anon, authenticated');
    expect(sql).toContain('revoke all on content.daily_readings from public, anon, authenticated, service_role');
    expect(sql).not.toContain('No prediction is stated');
    expect(sql.toLowerCase()).not.toContain('insert into');
  });
});
