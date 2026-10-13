import { shiftIsoDate } from '@/modules/calendar/dates';

describe('civil dates', () => {
  it('shifts calendar days without timezone drift', () => {
    expect(shiftIsoDate('2026-10-14', 1)).toBe('2026-10-15');
    expect(shiftIsoDate('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftIsoDate('2024-02-28', 1)).toBe('2024-02-29');
    expect(shiftIsoDate('2023-02-28', 1)).toBe('2023-03-01');
  });
});
