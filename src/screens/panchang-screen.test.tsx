import { fireEvent } from '@testing-library/react-native';

import { formatCivilDate } from '@/modules/calendar/dates';
import { PanchangScreen } from '@/screens/panchang-screen';
import { renderWithApp } from '@/test/render-with-app';

describe('Panchang screen', () => {
  it('changes the civil date and city without calculating a Panchang', async () => {
    const view = await renderWithApp(<PanchangScreen initialDate="2026-10-14" />);

    expect(view.getByText(formatCivilDate('2026-10-14', 'en'))).toBeTruthy();
    expect(view.getByText(/does not calculate tithi/)).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Next day'));
    expect(view.getByText(formatCivilDate('2026-10-15', 'en'))).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Previous day'));
    expect(view.getByText(formatCivilDate('2026-10-14', 'en'))).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Maharashtra'));
    await fireEvent.press(view.getByLabelText('Mumbai'));

    expect(view.getByText(/Panchang values are not connected/)).toBeTruthy();
    expect(view.queryByText(/Shukla|Rohini|Amavasya/)).toBeNull();
  });

  it('labels a cached fixture Panchang as stale', async () => {
    const view = await renderWithApp(
      <PanchangScreen
        initialDate="2026-10-14"
        remote={{
          state: {
            status: 'stale',
            cached: true,
            retrievedAt: '2026-10-14T00:00:00.000Z',
            value: {
              status: 'ready',
              source: 'validated',
              tithi: 'Fixture tithi',
              nakshatra: 'Fixture nakshatra',
              sunrise: '06:00',
              sunset: '18:00',
            },
          },
          retry: () => undefined,
        }}
      />,
    );

    expect(view.getByText(/This Panchang copy is stale/)).toBeTruthy();
    expect(view.getByText(/Fixture tithi/)).toBeTruthy();
    expect(view.queryByText(/Panchang values are not connected/)).toBeNull();
  });
});
