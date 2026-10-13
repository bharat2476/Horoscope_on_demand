import { fireEvent } from '@testing-library/react-native';

import { TemplesScreen } from '@/screens/temples-screen';
import { renderWithApp } from '@/test/render-with-app';

describe('Temples screen', () => {
  it('searches and filters an empty directory', async () => {
    const view = await renderWithApp(<TemplesScreen />);

    expect(view.getByText(/No temple is listed/)).toBeTruthy();

    await fireEvent.changeText(view.getByLabelText('Search temples'), 'fixture');
    expect(view.getByText('No reviewed temple matches this search.')).toBeTruthy();
    expect(view.queryByText('Fixture Mataji')).toBeNull();

    await fireEvent.press(view.getByLabelText('Clear'));
    await fireEvent.press(view.getByLabelText('Maharashtra'));
    await fireEvent.press(view.getByLabelText('Pune'));

    expect(view.getByText('No reviewed temple matches this search.')).toBeTruthy();
    expect(view.getByText('Placeholder')).toBeTruthy();
  });
});
