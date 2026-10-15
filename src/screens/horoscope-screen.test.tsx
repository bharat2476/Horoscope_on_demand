import { RASHIS } from '@/modules/horoscope';
import { HoroscopeScreen } from '@/screens/horoscope-screen';
import { TodayScreen } from '@/screens/today-screen';
import { renderWithApp } from '@/test/render-with-app';

describe('Rashi horoscope screens', () => {
  it('lists all twelve Rashis on Today without a prediction', async () => {
    const view = await renderWithApp(<TodayScreen />);

    for (const rashi of RASHIS) {
      expect(view.getByLabelText(rashi.label)).toBeTruthy();
    }
    expect(view.getByText(/No horoscope is shown/)).toBeTruthy();
    expect(view.queryByText(/Development example/)).toBeNull();
    expect(view.queryByText(/Sign in/i)).toBeNull();
  });

  it('opens one Rashi for a date that has no published reading', async () => {
    const view = await renderWithApp(
      <HoroscopeScreen rashiId="mesha" date="2026-10-15" onOpenRashi={() => undefined} />,
    );

    expect(view.getByText('Mesha (Aries)')).toBeTruthy();
    expect(view.getByText('Previous Rashi')).toBeTruthy();
    expect(view.getByText('Next Rashi')).toBeTruthy();
    expect(view.getByText(/No reviewed horoscope is published for this date/)).toBeTruthy();
    expect(view.queryByText(/Development example/)).toBeNull();
  });
});
