import { type ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { type MessageKey } from '@/modules/localization';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const SHELL_TABS = [
  { name: 'index', titleKey: 'tabs.today', icon: 'calendar-today' },
  { name: 'panchang', titleKey: 'tabs.panchang', icon: 'calendar-month-outline' },
  { name: 'rituals', titleKey: 'tabs.rituals', icon: 'book-open-outline' },
  { name: 'temples', titleKey: 'tabs.temples', icon: 'map-marker-outline' },
  { name: 'settings', titleKey: 'tabs.settings', icon: 'cog-outline' },
] as const satisfies readonly { name: string; titleKey: MessageKey; icon: IconName }[];

export type ShellTabName = (typeof SHELL_TABS)[number]['name'];
