import { render } from '@testing-library/react-native';

import { UnavailableNotice } from '@/components/unavailable-notice';

describe('UnavailableNotice', () => {
  it('shows the placeholder title and body it is given', async () => {
    const view = await render(
      <UnavailableNotice title="Not available yet" body="No horoscope is shown here." />,
    );

    expect(view.getByText('Not available yet')).toBeTruthy();
    expect(view.getByText('No horoscope is shown here.')).toBeTruthy();
  });
});
