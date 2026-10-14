import { activitySummary, recordActivity, DEFAULT_GROWTH } from '@/modules/growth/metrics';
import {
  BROADCAST_NOTIFICATIONS_APPROVED,
  permissionStep,
  reminderClock,
} from '@/modules/preferences/notifications';

describe('on-device activity', () => {
  it('records the first launch and a later return without leaving the device', () => {
    const first = recordActivity(DEFAULT_GROWTH, '2026-10-01');
    const next = recordActivity(first.state, '2026-10-14');
    expect(first.events.map((event) => event.name)).toEqual(['first_launch', 'activity_day']);
    expect(activitySummary(next.state, '2026-10-14')).toMatchObject({
      activeToday: true,
      returning: true,
      onboardingCompleted: false,
    });
    expect(activitySummary(next.state, '2026-10-14').activeDaysThisWeek).toBe(1);
  });
});

describe('reminder delivery', () => {
  it('holds permission and moves a quiet-hours reminder to the morning', () => {
    expect(BROADCAST_NOTIFICATIONS_APPROVED).toBe(false);
    expect(
      permissionStep({
        broadcastApproved: false,
        reminderEnabled: true,
        explained: true,
        osStatus: 'not-requested',
      }),
    ).toBe('held');
    expect(
      permissionStep({
        broadcastApproved: true,
        reminderEnabled: true,
        explained: false,
        osStatus: 'not-requested',
      }),
    ).toBe('explain');
    expect(reminderClock('23:30', '22:00', '07:00')).toBe('07:00');
    expect(reminderClock('08:15', '22:00', '07:00')).toBe('08:15');
  });
});
