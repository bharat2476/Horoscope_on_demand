import { credentialIsShortLived } from '@/modules/puja/sessions';
import { type SessionRole } from '@/modules/puja/types';

export type ConnectionPhase =
  'idle' | 'checking' | 'connected' | 'reconnecting' | 'ended' | 'failed';

export type SessionMedia = {
  phase: ConnectionPhase;
  microphone: 'muted' | 'live';
  camera: 'off' | 'on';
  attempt: number;
  failure: 'unauthorized' | 'expired' | 'interrupted' | null;
  recording: false;
};

export function createSessionController(input: {
  role: SessionRole;
  maxReconnects?: number;
  token: string | null;
  nowSeconds: number;
}) {
  const maxReconnects = input.maxReconnects ?? 3;
  let media: SessionMedia = {
    phase: 'idle',
    microphone: input.role === 'priest' ? 'live' : 'muted',
    camera: 'off',
    attempt: 0,
    failure: null,
    recording: false,
  };

  function snapshot(): SessionMedia {
    return { ...media };
  }

  return {
    getState: snapshot,
    connect(): SessionMedia {
      if (!input.token || !credentialIsShortLived(input.token, input.nowSeconds)) {
        media = { ...media, phase: 'failed', failure: input.token ? 'expired' : 'unauthorized' };
        return snapshot();
      }
      media = { ...media, phase: 'checking', failure: null };
      media = { ...media, phase: 'connected' };
      return snapshot();
    },
    onLinkLost(): SessionMedia {
      if (media.phase !== 'connected' && media.phase !== 'reconnecting') {
        return snapshot();
      }
      if (media.attempt >= maxReconnects) {
        media = { ...media, phase: 'failed', failure: 'interrupted' };
        return snapshot();
      }
      media = { ...media, phase: 'reconnecting', attempt: media.attempt + 1 };
      return snapshot();
    },
    reconnectSucceeded(): SessionMedia {
      if (media.phase !== 'reconnecting') {
        return snapshot();
      }
      media = { ...media, phase: 'connected' };
      return snapshot();
    },
    setMicrophone(next: 'muted' | 'live'): SessionMedia {
      media = { ...media, microphone: next };
      return snapshot();
    },
    setCamera(next: 'off' | 'on'): SessionMedia {
      media = { ...media, camera: next };
      return snapshot();
    },
    end(): SessionMedia {
      media = { ...media, phase: 'ended', microphone: 'muted', camera: 'off' };
      return snapshot();
    },
  };
}
