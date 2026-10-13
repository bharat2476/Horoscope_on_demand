import { TodayScreen } from '@/screens/today-screen';
import { renderWithApp } from '@/test/render-with-app';

describe('Today screen', () => {
  it('reserves horoscope, Panchang, festival, and ritual sections', async () => {
    const view = await renderWithApp(<TodayScreen />);

    expect(view.getByText('Daily Rashi horoscope')).toBeTruthy();
    expect(view.getByText('Panchang summary')).toBeTruthy();
    expect(view.getByText('Festival')).toBeTruthy();
    expect(view.getByText('Reviewed ritual')).toBeTruthy();
    expect(view.getAllByText('Placeholder')).toHaveLength(4);
    expect(view.getByText(/No horoscope is shown/)).toBeTruthy();
    expect(view.getByText(/No festival is listed/)).toBeTruthy();
    expect(view.queryByText(/Shukla|Rohini|Amavasya/)).toBeNull();
  });
});
