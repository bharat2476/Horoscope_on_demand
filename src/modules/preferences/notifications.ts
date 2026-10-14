export const NOTIFICATION_DELIVERY = 'off' as const;

/** Broadcast and push stay off until a later approval. Opt-in is only stored on the device. */
export const BROADCAST_NOTIFICATIONS_APPROVED: boolean = false;

export type NotificationChannel = 'festivals' | 'rituals' | 'horoscope' | 'panchang';

export type NotificationPreferences = {
  delivery: typeof NOTIFICATION_DELIVERY;
  festivals: boolean;
  rituals: boolean;
  horoscope: boolean;
  panchang: boolean;
  quietStart: string;
  quietEnd: string;
};

export const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  delivery: 'off',
  festivals: false,
  rituals: false,
  horoscope: false,
  panchang: false,
  quietStart: '22:00',
  quietEnd: '07:00',
};

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

/** This phase does not request notification permission at launch. */
export function notificationPermissionRequest(): 'not-requested' {
  return 'not-requested';
}

export type PermissionStep = 'held' | 'idle' | 'explain' | 'ask' | 'granted' | 'denied';

/**
 * Permission is asked only after the benefit has been explained and delivery is approved.
 * While broadcast delivery is unapproved, the step stays held and no dialog is opened.
 */
export function permissionStep(input: {
  broadcastApproved: boolean;
  reminderEnabled: boolean;
  explained: boolean;
  osStatus: 'not-requested' | 'granted' | 'denied';
}): PermissionStep {
  if (!input.broadcastApproved) {
    return 'held';
  }
  if (!input.reminderEnabled) {
    return 'idle';
  }
  if (input.osStatus === 'granted') {
    return 'granted';
  }
  if (input.osStatus === 'denied') {
    return 'denied';
  }
  if (!input.explained) {
    return 'explain';
  }
  return 'ask';
}

function toMinutes(clock: string): number | null {
  if (!CLOCK.test(clock)) {
    return null;
  }
  const [hour, minute] = clock.split(':').map(Number);
  return hour * 60 + minute;
}

export function isQuietTime(clock: string, quietStart: string, quietEnd: string): boolean {
  const now = toMinutes(clock);
  const start = toMinutes(quietStart);
  const end = toMinutes(quietEnd);
  if (now === null || start === null || end === null || start === end) {
    return false;
  }
  if (start < end) {
    return now >= start && now < end;
  }
  return now >= start || now < end;
}

/** Moves a reminder that lands in quiet hours to the end of that window. */
export function reminderClock(preferred: string, quietStart: string, quietEnd: string): string {
  if (!CLOCK.test(preferred) || !CLOCK.test(quietEnd)) {
    return DEFAULT_NOTIFICATIONS.quietEnd;
  }
  if (!isQuietTime(preferred, quietStart, quietEnd)) {
    return preferred;
  }
  return quietEnd;
}

export function parseNotificationPreferences(value: unknown): NotificationPreferences {
  if (typeof value !== 'object' || value === null) {
    return DEFAULT_NOTIFICATIONS;
  }
  const record = value as Record<string, unknown>;
  const quietStart = typeof record.quietStart === 'string' && CLOCK.test(record.quietStart)
    ? record.quietStart
    : DEFAULT_NOTIFICATIONS.quietStart;
  const quietEnd = typeof record.quietEnd === 'string' && CLOCK.test(record.quietEnd)
    ? record.quietEnd
    : DEFAULT_NOTIFICATIONS.quietEnd;
  return {
    delivery: 'off',
    festivals: record.festivals === true,
    rituals: record.rituals === true,
    horoscope: record.horoscope === true,
    panchang: record.panchang === true,
    quietStart,
    quietEnd,
  };
}
