import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { createPujaGateway, createSessionController, type SessionCredential } from '@/modules/puja';
import { type SessionMedia } from '@/modules/puja/controller';
import { PujaSessionScreen } from '@/screens/puja-session-screen';

export default function PujaSessionRoute() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const gateway = useMemo(() => createPujaGateway(), []);
  const [media, setMedia] = useState<SessionMedia | null>(null);
  const [unavailable, setUnavailable] = useState<
    'not_open' | 'video_unconfigured' | 'unauthorized' | null
  >(null);
  const [controller, setController] = useState<ReturnType<typeof createSessionController> | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    if (!bookingId) {
      return undefined;
    }
    gateway.requestSessionCredential(bookingId, Math.floor(Date.now() / 1000)).then((result) => {
      if (!active) {
        return;
      }
      if (!result.ok) {
        const reason = result.reason;
        setUnavailable(
          reason === 'video_unconfigured' || reason === 'not_open' || reason === 'unauthorized'
            ? reason
            : 'unauthorized',
        );
        return;
      }
      const credential: SessionCredential = result.value;
      const next = createSessionController({
        role: credential.microphoneMuted ? 'customer' : 'priest',
        token: credential.token,
        nowSeconds: Math.floor(Date.now() / 1000),
      });
      next.connect();
      setController(next);
      setMedia(next.getState());
    });
    return () => {
      active = false;
    };
  }, [bookingId, gateway]);

  return (
    <PujaSessionScreen
      media={media}
      unavailable={unavailable}
      onToggleMicrophone={() => {
        if (!controller || !media) {
          return;
        }
        setMedia(controller.setMicrophone(media.microphone === 'muted' ? 'live' : 'muted'));
      }}
      onToggleCamera={() => {
        if (!controller || !media) {
          return;
        }
        setMedia(controller.setCamera(media.camera === 'off' ? 'on' : 'off'));
      }}
      onEnd={() => {
        if (!controller) {
          return;
        }
        setMedia(controller.end());
      }}
    />
  );
}
