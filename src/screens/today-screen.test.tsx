import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent } from '@testing-library/react-native';

import { PanchangFields } from '@/components/panchang-fields';
import { type DashboardModel } from '@/modules/dashboard/load';
import { RASHIS } from '@/modules/horoscope';
import { TodayScreen } from '@/screens/today-screen';
import { renderWithApp } from '@/test/render-with-app';

const loaded: DashboardModel = {
  date: '2026-10-15',
  panchang: { status: 'unavailable' },
  rashis: RASHIS.map((rashi) => rashi.id),
  guidance: 'unavailable',
  practice: { status: 'unavailable' },
  festivals: { status: 'unavailable' },
  temples: { status: 'unavailable' },
  ritual: 'unavailable',
};

describe('Today screen', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('shows the dashboard sections and all twelve Rashis without invented Panchang values', async () => {
    const view = await renderWithApp(<TodayScreen />);

    expect(view.getByText('Welcome')).toBeTruthy();
    expect(view.getByText(/Public sections open without an account/)).toBeTruthy();
    expect(await view.findByText("Today's Panchang")).toBeTruthy();
    expect(view.getByText(/Tithi, nakshatra, sunrise, and sunset are not shown/)).toBeTruthy();
    expect(view.getByText("Today's spiritual guidance")).toBeTruthy();
    expect(view.getByText('Daily practice')).toBeTruthy();
    expect(view.getByText('Upcoming festivals')).toBeTruthy();
    expect(view.getByText('Temples')).toBeTruthy();
    expect(view.getByText(/No horoscope is shown/)).toBeTruthy();
    expect(view.getByText(/No reviewed festival is listed/)).toBeTruthy();
    expect(view.queryByText(/Shukla|Rohini|Amavasya/)).toBeNull();
    expect(view.queryByText(/\d{1,2}:\d{2}/)).toBeNull();
    expect(view.queryByRole('button', { name: /sign in/i })).toBeNull();

    for (const rashi of RASHIS) {
      expect(view.getByLabelText(rashi.label)).toBeTruthy();
    }
  });

  it('changes the welcome line when a language is chosen', async () => {
    const view = await renderWithApp(<TodayScreen />);
    await fireEvent.press(view.getByLabelText('Choose language'));
    await fireEvent.press(view.getByLabelText('हिन्दी'));
    expect(view.getByText('स्वागत है')).toBeTruthy();
  });

  it('shows an error and retries the dashboard load', async () => {
    let open = false;
    const view = await renderWithApp(
      <TodayScreen
        load={() => {
          if (!open) {
            throw new Error('dashboard failed');
          }
          return loaded;
        }}
      />,
    );

    expect(await view.findByText(/could not be loaded/)).toBeTruthy();
    open = true;
    await fireEvent.press(view.getByLabelText('Try again'));
    expect(await view.findByText("Today's Panchang")).toBeTruthy();
  });
});

describe('Panchang fields', () => {
  it('renders validated fields only when a validated record is supplied', async () => {
    const view = await renderWithApp(
      <PanchangFields
        value={{
          tithi: 'Sample tithi label',
          nakshatra: 'Sample nakshatra label',
          sunrise: '06:00',
          sunset: '18:00',
        }}
        tithiLabel="Tithi"
        nakshatraLabel="Nakshatra"
        sunriseLabel="Sunrise"
        sunsetLabel="Sunset"
      />,
    );
    expect(view.getByText(/Sample tithi label/)).toBeTruthy();
    expect(view.getByText(/06:00/)).toBeTruthy();
  });
});
