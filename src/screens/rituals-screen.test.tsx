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

  it('shows loading, error, retry, a fixture ritual, and a missing translation', async () => {
    const loading = await renderWithApp(
      <RitualsScreen remote={{ state: { status: 'loading' }, retry: () => undefined }} />,
    );
    expect(loading.getByText('Loading')).toBeTruthy();

    const retry = jest.fn();
    const failed = await renderWithApp(
      <RitualsScreen remote={{ state: { status: 'error' }, retry }} />,
    );
    expect(failed.getByText('Approved content could not be loaded.')).toBeTruthy();
    await fireEvent.press(failed.getByLabelText('Try again'));
    expect(retry).toHaveBeenCalled();

    const ready = await renderWithApp(
      <RitualsScreen
        remote={{
          state: {
            status: 'ready',
            cached: false,
            value: [
              {
                id: 'fixture-ritual',
                category: 'home',
                title: { en: 'Fixture ritual label' },
                steps: null,
              },
            ],
          },
          retry: () => undefined,
        }}
      />,
    );
    expect(ready.getByText('Fixture ritual label')).toBeTruthy();

    const missing = await renderWithApp(
      <RitualsScreen
        remote={{
          state: {
            status: 'cached',
            savedAt: '2026-10-15T00:00:00.000Z',
            value: [
              {
                id: 'fixture-ritual-hi',
                category: 'home',
                title: { hi: 'फिक्स्चर विधि' },
                steps: null,
              },
            ],
          },
          retry: () => undefined,
        }}
      />,
    );
    expect(missing.getByText(/This language has not been reviewed/)).toBeTruthy();
    expect(missing.getByText(/last approved copy/)).toBeTruthy();
    expect(missing.queryByText('फिक्स्चर विधि')).toBeNull();
  });
});
