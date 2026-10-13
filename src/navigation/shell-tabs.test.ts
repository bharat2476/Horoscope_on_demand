import { SHELL_TABS } from '@/navigation/shell-tabs';

describe('shell tabs', () => {
  it('keeps public sections in the tab bar', () => {
    expect(SHELL_TABS.map((tab) => tab.name)).toEqual([
      'index',
      'panchang',
      'rituals',
      'temples',
      'settings',
    ]);
    expect(SHELL_TABS.map((tab) => tab.titleKey)).toEqual([
      'tabs.today',
      'tabs.panchang',
      'tabs.rituals',
      'tabs.temples',
      'tabs.settings',
    ]);
  });
});
