import { Screen } from '@/components/screen';
import { UnavailableNotice } from '@/components/unavailable-notice';
import { getPanchangAvailability } from '@/modules/panchang';
import { useApp } from '@/providers/app-provider';

export default function PanchangScreen() {
  const { t } = useApp();
  const result = getPanchangAvailability();

  return (
    <Screen>
      {result.status === 'unavailable' ? (
        <UnavailableNotice title={t('unavailable.title')} body={t('unavailable.panchang')} />
      ) : null}
    </Screen>
  );
}
