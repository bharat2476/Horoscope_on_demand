import { Screen } from '@/components/screen';
import { UnavailableNotice } from '@/components/unavailable-notice';
import { listMatajiTemples } from '@/modules/temples';
import { useApp } from '@/providers/app-provider';

export default function TemplesScreen() {
  const { t } = useApp();
  const temples = listMatajiTemples();

  return (
    <Screen>
      {temples.length === 0 ? (
        <UnavailableNotice title={t('unavailable.title')} body={t('unavailable.temples')} />
      ) : null}
    </Screen>
  );
}
