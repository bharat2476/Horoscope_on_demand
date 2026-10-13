import { parseAppEnvironment } from '@/modules/release/environment';

describe('app environment', () => {
  it('treats a blank value as development and rejects an unknown name', () => {
    expect(parseAppEnvironment(undefined)).toBe('development');
    expect(parseAppEnvironment('  ')).toBe('development');
    expect(parseAppEnvironment('staging')).toBe('staging');
    expect(parseAppEnvironment('production')).toBe('production');
    expect(() => parseAppEnvironment('prod')).toThrow('Unknown app environment');
  });
});
