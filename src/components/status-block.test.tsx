import { render } from '@testing-library/react-native';

import { StatusBlock } from '@/components/status-block';

describe('StatusBlock', () => {
  it('shows a progress indicator while loading', async () => {
    const view = await render(<StatusBlock status="loading" title="Loading" body="" />);

    expect(view.getByLabelText('Loading').props.accessibilityRole).toBe('progressbar');
    expect(view.queryByText('Placeholder')).toBeNull();
  });

  it('labels an empty result as a placeholder', async () => {
    const view = await render(
      <StatusBlock
        status="empty"
        title="Nothing to show"
        body="No reviewed ritual matches this search."
        placeholderLabel="Placeholder"
      />,
    );

    expect(view.getByText('Placeholder')).toBeTruthy();
    expect(view.getByText('Nothing to show')).toBeTruthy();
  });

  it('shows an error without a substitute', async () => {
    const view = await render(
      <StatusBlock
        status="error"
        title="Something went wrong"
        body="This section could not be loaded. No substitute information is shown."
        placeholderLabel="Placeholder"
      />,
    );

    expect(view.getByLabelText('Something went wrong').props.accessibilityRole).toBe('alert');
    expect(view.queryByText('Placeholder')).toBeNull();
  });

  it('marks unavailable content as a placeholder', async () => {
    const view = await render(
      <StatusBlock
        status="unavailable"
        title="Not available yet"
        body="No horoscope is shown."
        placeholderLabel="Placeholder"
      />,
    );

    expect(view.getByText('Placeholder')).toBeTruthy();
    expect(view.getByText('No horoscope is shown.')).toBeTruthy();
  });
});
