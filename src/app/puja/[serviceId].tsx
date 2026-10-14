import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { StatusBlock } from '@/components/status-block';
import { createPujaGateway, formatInr, type PublicServiceView } from '@/modules/puja';
import { useApp } from '@/providers/app-provider';
import { ChoiceRow } from '@/components/choice-row';
import { Screen } from '@/components/screen';
import { SectionCard } from '@/components/section-card';
import { ThemedText } from '@/components/themed-text';

export default function PujaDetailRoute() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { t } = useApp();
  const [service, setService] = useState<PublicServiceView | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    createPujaGateway()
      .listServices()
      .then((services) => {
        if (active) {
          setService(services.find((item) => item.id === serviceId) ?? null);
        }
      });
    return () => {
      active = false;
    };
  }, [serviceId]);

  if (service === undefined) {
    return <StatusBlock status="loading" title={t('status.loading')} body="" />;
  }
  if (!service) {
    return (
      <StatusBlock
        status="unavailable"
        title={t('status.unavailableTitle')}
        body={t('puja.empty')}
        placeholderLabel={t('status.placeholder')}
      />
    );
  }
  return (
    <Screen>
      <SectionCard title={service.title} detail={formatInr(service.pricePaise)}>
        <ThemedText>{service.description}</ThemedText>
        <ThemedText>
          {t('puja.preparation')}: {service.preparation}
        </ThemedText>
        <ThemedText type="caption">{t('puja.familyOnly')}</ThemedText>
        <ChoiceRow
          label={t('puja.book')}
          selected={false}
          onPress={() => router.push(`/puja/request/${service.id}`)}
        />
      </SectionCard>
    </Screen>
  );
}
