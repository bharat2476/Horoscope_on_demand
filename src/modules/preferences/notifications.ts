export const NOTIFICATION_DELIVERY = 'off' as const;

export type NotificationChannel = 'festivals' | 'rituals';

export type NotificationPreferences = {
  delivery: typeof NOTIFICATION_DELIVERY;
  festivals: boolean;
  rituals: boolean;
};

export const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  delivery: 'off',
  festivals: false,
  rituals: false,
};

/** This phase records intent only. It does not request notification permission or deliver a push. */
export function notificationPermissionRequest(): 'not-requested' {
  return 'not-requested';
}

export function parseNotificationPreferences(value: unknown): NotificationPreferences {
  if (typeof value !== 'object' || value === null) {
    return DEFAULT_NOTIFICATIONS;
  }
  const record = value as Record<string, unknown>;
  return {
    delivery: 'off',
    festivals: record.festivals === true,
    rituals: record.rituals === true,
  };
}
