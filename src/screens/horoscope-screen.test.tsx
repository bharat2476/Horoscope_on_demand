import { fireEvent } from '@testing-library/react-native';

import { RASHIS } from '@/modules/horoscope';
import { parsePublishedDailyRow } from '@/modules/backend';
import { HoroscopeScreen } from '@/screens/horoscope-screen';
import { TodayScreen } from '@/screens/today-screen';
import { renderWithApp } from '@/test/render-with-app';

describe('Rashi horoscope screens', () => {
  it('lists all twelve Rashis on Today without a prediction', async () => {
    const view = await renderWithApp(<TodayScreen />);

    await fireEvent.press(view.getByLabelText('Rashis'));
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

  it('shows a calculated transit without a prediction', async () => {
    const view = await renderWithApp(
      <HoroscopeScreen
        rashiId="mesha"
        date="2026-10-16"
        onOpenRashi={() => undefined}
        transit={{
          status: 'accepted',
          value: {
            status: 'accepted',
            moonSignId: 'vrishchika',
            sunSignId: 'kanya',
            moonHouse: 8,
            sunHouse: 6,
          },
        }}
      />,
    );

    expect(view.getByText(/Calculated transit at local sunrise/)).toBeTruthy();
    expect(view.getByText(/Vrishchika \(Scorpio\)/)).toBeTruthy();
    expect(view.getByText(/House 8/)).toBeTruthy();
    expect(view.getByText(/No reviewed horoscope is published for this date/)).toBeTruthy();
    expect(view.queryByText(/birth/i)).toBeNull();
  });

  it('does not show a fixture Hindi reading as an English translation', async () => {
    const reading = parsePublishedDailyRow({
      id: 'fixture-daily-hi',
      civil_date: '2026-10-15',
      rashi_id: 'mesha',
      language: 'hi',
      version: 1,
      tradition: 'Fixture tradition',
      sources: [],
      body: {
        outlook: 'फिक्स्चर',
        family: 'फिक्स्चर',
        career: 'फिक्स्चर',
        finance: 'फिक्स्चर',
        financeEducation: 'फिक्स्चर',
        action: 'फिक्स्चर',
      },
    });
    if (!reading) {
      throw new Error('fixture reading failed to parse');
    }
    const view = await renderWithApp(
      <HoroscopeScreen
        date="2026-10-15"
        onOpenRashi={() => undefined}
        rashiId="mesha"
        remote={{
          state: { status: 'ready', cached: false, value: [reading] },
          retry: () => undefined,
        }}
      />,
    );

    expect(view.getByText(/No reviewed text is published in this language/)).toBeTruthy();
    expect(view.queryByText('फिक्स्चर')).toBeNull();
  });
});
