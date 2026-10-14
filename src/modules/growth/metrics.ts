import { type AnalyticsEvent } from '@/modules/analytics';

export type AdChoice = 'unset' | 'declined' | 'non-personalized' | 'personalized';
export type AgeBand = 'unknown' | 'under-18' | '18-plus';

export type GrowthState = {
  firstLaunchOn: string | null;
  onboardingCompleted: boolean;
  activeDates: readonly string[];
  adChoice: AdChoice;
  ageBand: AgeBand;
  notificationExplained: boolean;
};

export const DEFAULT_GROWTH: GrowthState = {
  firstLaunchOn: null,
  onboardingCompleted: false,
  activeDates: [],
  adChoice: 'unset',
  ageBand: 'unknown',
  notificationExplained: false,
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function keepDates(dates: readonly string[]): string[] {
  return dates.filter((date) => DATE.test(date)).slice(-35);
}

export function parseGrowthState(value: unknown): GrowthState {
  if (typeof value !== 'object' || value === null) {
    return DEFAULT_GROWTH;
  }
  const record = value as Record<string, unknown>;
  const adChoice: AdChoice =
    record.adChoice === 'declined' || record.adChoice === 'non-personalized' || record.adChoice === 'personalized'
      ? record.adChoice
      : 'unset';
  const ageBand: AgeBand = record.ageBand === 'under-18' || record.ageBand === '18-plus' ? record.ageBand : 'unknown';
  return {
    firstLaunchOn: typeof record.firstLaunchOn === 'string' && DATE.test(record.firstLaunchOn) ? record.firstLaunchOn : null,
    onboardingCompleted: record.onboardingCompleted === true,
    activeDates: Array.isArray(record.activeDates) ? keepDates(record.activeDates.filter((item) => typeof item === 'string')) : [],
    adChoice,
    ageBand,
    notificationExplained: record.notificationExplained === true,
  };
}

export function recordActivity(state: GrowthState, today: string): { state: GrowthState; events: AnalyticsEvent[] } {
  if (!DATE.test(today)) {
    return { state, events: [] };
  }
  const events: AnalyticsEvent[] = [];
  let next = state;
  if (next.firstLaunchOn === null) {
    next = { ...next, firstLaunchOn: today };
    events.push({ name: 'first_launch', properties: { on: today } });
  }
  if (!next.activeDates.includes(today)) {
    next = { ...next, activeDates: keepDates([...next.activeDates, today]) };
    events.push({ name: 'activity_day', properties: { on: today } });
  }
  return { state: next, events };
}

function shiftDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function activitySummary(state: GrowthState, today: string): {
  activeToday: boolean;
  activeDaysThisWeek: number;
  returning: boolean;
  onboardingCompleted: boolean;
} {
  const week = new Set(Array.from({ length: 7 }, (_, index) => shiftDate(today, -index)));
  const activeDaysThisWeek = state.activeDates.filter((date) => week.has(date)).length;
  return {
    activeToday: state.activeDates.includes(today),
    activeDaysThisWeek,
    returning: state.activeDates.some((date) => date < today) && state.activeDates.includes(today),
    onboardingCompleted: state.onboardingCompleted,
  };
}
