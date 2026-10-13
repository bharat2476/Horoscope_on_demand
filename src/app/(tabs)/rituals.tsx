import { Screen } from '@/components/screen';
import { UnavailableNotice } from '@/components/unavailable-notice';
import { listReviewedRituals } from '@/modules/rituals';
import { useApp } from '@/providers/app-provider';

export default function RitualsScreen() {
  const { t } = useApp();
  const rituals = listReviewedRituals();

  return (
    <Screen>
      {rituals.length === 0 ? (
        <UnavailableNotice title={t('unavailable.title')} body={t('unavailable.rituals')} />
      ) : null}
    </Screen>
  );
}
