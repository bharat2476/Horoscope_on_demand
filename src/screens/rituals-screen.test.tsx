import { fireEvent } from '@testing-library/react-native';

import { RitualsScreen } from '@/screens/rituals-screen';
import { renderWithApp } from '@/test/render-with-app';

describe('Rituals screen', () => {
  it('filters an empty reviewed catalog by search and category', async () => {
    const view = await renderWithApp(<RitualsScreen />);

    expect(view.getByText('Daily worship')).toBeTruthy();
    expect(view.getByText('Vrata')).toBeTruthy();
    expect(view.getByText('Festival')).toBeTruthy();
    expect(view.getByText('Home')).toBeTruthy();
    expect(view.getByText(/No ritual steps are shown/)).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Vrata'));
    expect(view.getByText('No reviewed ritual matches this search.')).toBeTruthy();

    await fireEvent.changeText(view.getByLabelText('Search rituals'), 'fixture');
    expect(view.queryByText('Fixture vrata')).toBeNull();
    expect(view.getByText('Placeholder')).toBeTruthy();
  });
});
