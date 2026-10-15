import { fireEvent } from '@testing-library/react-native';

import { PriestAvatar } from '@/components/priest-avatar';
import { renderWithApp } from '@/test/render-with-app';

describe('PriestAvatar', () => {
  it('shows an illustrative avatar and says it is not a photograph of an assigned priest', async () => {
    const view = await renderWithApp(
      <PriestAvatar
        disclaimer="Illustrative AI avatar. This is not a photograph of your assigned priest."
        label="Illustrative priest"
        variant="elderly"
      />,
    );

    expect(
      view.getByText('Illustrative AI avatar. This is not a photograph of your assigned priest.'),
    ).toBeTruthy();
    expect(view.getByLabelText(/not a photograph of your assigned priest/)).toBeTruthy();
    expect(view.queryByText(/photograph of the priest/i)).toBeNull();
  });

  it('uses a text fallback when the image fails', async () => {
    const view = await renderWithApp(
      <PriestAvatar
        disclaimer="Illustrative AI avatar. This is not a photograph of your assigned priest."
        label="Illustrative priest"
        variant="young-adult"
      />,
    );

    await fireEvent(view.getByLabelText(/Illustrative priest/), 'error');

    expect(view.getByText('Illustrative priest')).toBeTruthy();
    expect(
      view.getByText('Illustrative AI avatar. This is not a photograph of your assigned priest.'),
    ).toBeTruthy();
  });
});
