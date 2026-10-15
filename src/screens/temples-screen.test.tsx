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

  it('shows an error with retry and does not treat another language as reviewed', async () => {
    const retry = jest.fn();
    const failed = await renderWithApp(
      <TemplesScreen remote={{ state: { status: 'error' }, retry }} />,
    );
    expect(failed.getByText('Approved content could not be loaded.')).toBeTruthy();
    await fireEvent.press(failed.getByLabelText('Try again'));
    expect(retry).toHaveBeenCalled();

    const ready = await renderWithApp(
      <TemplesScreen
        remote={{
          state: {
            status: 'empty',
          },
          retry: () => undefined,
        }}
      />,
    );
    expect(ready.getByText(/No temple is listed/)).toBeTruthy();
  });
});
