import { fireEvent } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

describe('shell navigation', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('opens every public screen without an account', async () => {
    const rendered = renderRouter('./src/app', { initialUrl: '/' });
    const view = await rendered;

    expect(view.getByText(/Public sections open without an account/)).toBeTruthy();

    await fireEvent.press(view.getByTestId('tab-panchang'));
    expect(view.getByText(/Choosing a city does not calculate a Panchang/)).toBeTruthy();

    await fireEvent.press(view.getByTestId('tab-rituals'));
    expect(view.getByLabelText('Search rituals')).toBeTruthy();

    await fireEvent.press(view.getByTestId('tab-temples'));
    expect(view.getByLabelText('Search temples')).toBeTruthy();

    await fireEvent.press(view.getByTestId('tab-settings'));
    expect(view.getByText('Privacy')).toBeTruthy();
    expect(view.getByText(/Public sections stay open without an account/)).toBeTruthy();
  });
});
