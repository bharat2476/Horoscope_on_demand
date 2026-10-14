import { ChoiceRow } from '@/components/choice-row';
import { Screen } from '@/components/screen';
import { SectionCard } from '@/components/section-card';
import { ThemedText } from '@/components/themed-text';
import { type SessionMedia } from '@/modules/puja/controller';
import { useApp } from '@/providers/app-provider';

export function PujaSessionScreen({
  media,
  unavailable,
  onToggleMicrophone,
  onToggleCamera,
  onEnd,
}: {
  media: SessionMedia | null;
  unavailable: 'not_open' | 'video_unconfigured' | 'unauthorized' | null;
  onToggleMicrophone: () => void;
  onToggleCamera: () => void;
  onEnd: () => void;
}) {
  const { t } = useApp();
  return (
    <Screen>
      <SectionCard title={t('puja.session')}>
        <ThemedText>{t('puja.audioMuted')}</ThemedText>
        <ThemedText>{t('puja.recordingOff')}</ThemedText>
        <ThemedText type="caption">{t('puja.support')}</ThemedText>
        {unavailable === 'video_unconfigured' ? (
          <ThemedText>{t('puja.videoUnavailable')}</ThemedText>
        ) : null}
        {unavailable === 'not_open' || unavailable === 'unauthorized' ? (
          <ThemedText>{t('puja.notOpen')}</ThemedText>
        ) : null}
        {media?.phase === 'reconnecting' ? <ThemedText>{t('puja.reconnecting')}</ThemedText> : null}
        {media?.phase === 'failed' ? <ThemedText>{t('puja.sessionFailed')}</ThemedText> : null}
        {media ? (
          <>
            <ChoiceRow
              label={media.microphone === 'muted' ? t('puja.micOn') : t('puja.micOff')}
              selected={media.microphone === 'live'}
              onPress={onToggleMicrophone}
            />
            <ChoiceRow
              label={media.camera === 'off' ? t('puja.cameraOn') : t('puja.cameraOff')}
              selected={media.camera === 'on'}
              onPress={onToggleCamera}
            />
            <ChoiceRow label={t('puja.endSession')} selected={false} onPress={onEnd} />
          </>
        ) : null}
      </SectionCard>
    </Screen>
  );
}
