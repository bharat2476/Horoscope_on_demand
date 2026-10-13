import { fireEvent } from '@testing-library/react-native';

import { SettingsScreen } from '@/screens/settings-screen';
import { renderWithApp } from '@/test/render-with-app';

describe('Settings screen', () => {
  it('offers language, Rashi, city, privacy, and optional account access', async () => {
    const view = await renderWithApp(<SettingsScreen />);

    expect(view.getByText('Language')).toBeTruthy();
    expect(view.getByText('Use device language')).toBeTruthy();
    expect(view.getByText('हिन्दी')).toBeTruthy();
    expect(view.getByText('Rashi')).toBeTruthy();
    expect(view.getByText('Mesha (Aries)')).toBeTruthy();
    expect(view.getAllByText('City').length).toBeGreaterThan(0);
    expect(view.getByText('Privacy')).toBeTruthy();
    expect(view.getByText(/does not ask for permissions/)).toBeTruthy();
    expect(view.getByText('Account')).toBeTruthy();
    expect(view.getByText(/Public sections stay open without an account/)).toBeTruthy();
    expect(view.queryByRole('button', { name: /sign in/i })).toBeNull();

    await fireEvent.press(view.getByLabelText('Mesha (Aries)'));
    expect(view.getByText('Clear Rashi')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Gujarat'));
    await fireEvent.press(view.getByLabelText('Ahmedabad'));
    expect(view.getByText('Clear city')).toBeTruthy();
  });
});
