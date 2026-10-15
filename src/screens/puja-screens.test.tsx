import { fireEvent } from '@testing-library/react-native';

import { SAMPLE_SERVICES, type PublicServiceView } from '@/modules/puja';
import { LivePujaCatalog } from '@/screens/live-puja-screen';
import { PujaBookingScreen } from '@/screens/puja-booking-screen';
import { PujaSessionScreen } from '@/screens/puja-session-screen';
import { renderWithApp } from '@/test/render-with-app';

const service = SAMPLE_SERVICES[0];
if (!service) {
  throw new Error('missing sample service');
}

const view: PublicServiceView = {
  id: service.id,
  slug: service.slug,
  title: service.copy.title,
  description: service.copy.description,
  preparation: service.copy.preparation,
  pricePaise: service.pricePaise,
  currency: 'INR',
  durationMinutes: service.durationMinutes,
  languages: [...service.languages],
  minAdvanceHours: service.minAdvanceHours,
  requiredFamilyFields: [...service.requiredFamilyFields],
};

describe('live puja screens', () => {
  it('shows the public catalog without priest contact details', async () => {
    const viewTree = await renderWithApp(
      <LivePujaCatalog
        services={[view]}
        configured
        onOpenService={() => undefined}
        onOpenBookings={() => undefined}
      />,
    );
    expect(viewTree.getByText('Havan / Homa')).toBeTruthy();
    expect(viewTree.getByText(/One household/)).toBeTruthy();
    expect(viewTree.queryByText(/phone/i)).toBeNull();
    expect(viewTree.queryByText('Priest A')).toBeNull();
    expect(viewTree.getByText(/not a photograph of your assigned priest/)).toBeTruthy();
  });

  it('asks for an account before collecting household details', async () => {
    const hidden = await renderWithApp(
      <PujaBookingScreen
        service={view}
        signedIn={false}
        now={new Date('2026-10-14T08:00:00.000Z')}
        onSubmit={async () => ({ ok: true })}
      />,
    );
    expect(hidden.getByText(/Sign in from Settings/)).toBeTruthy();
    expect(hidden.queryByLabelText('Household name')).toBeNull();
  });

  it('keeps customer audio muted and recording off, and shows the fallback when the session fails', async () => {
    const screen = await renderWithApp(
      <PujaSessionScreen
        media={{
          phase: 'failed',
          microphone: 'muted',
          camera: 'off',
          attempt: 3,
          failure: 'interrupted',
          recording: false,
        }}
        unavailable={null}
        onToggleMicrophone={() => undefined}
        onToggleCamera={() => undefined}
        onEnd={() => undefined}
      />,
    );
    expect(screen.getByText('Your microphone starts muted.')).toBeTruthy();
    expect(screen.getByText('Recording is off.')).toBeTruthy();
    expect(screen.getByText(/Priest contact details are not shown/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Turn microphone on'));
  });
});
