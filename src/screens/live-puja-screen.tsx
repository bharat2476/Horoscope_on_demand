import { ChoiceRow } from '@/components/choice-row';
import { Screen } from '@/components/screen';
import { SectionCard } from '@/components/section-card';
import { StatusBlock } from '@/components/status-block';
import { ThemedText } from '@/components/themed-text';
import { formatInr, type PublicServiceView } from '@/modules/puja';
import { useApp } from '@/providers/app-provider';

export function LivePujaCatalog({
  services,
  configured,
  onOpenService,
  onOpenBookings,
}: {
  services: readonly PublicServiceView[];
  configured: boolean;
  onOpenService: (serviceId: string) => void;
  onOpenBookings: () => void;
}) {
  const { t } = useApp();

  return (
    <Screen>
      <ThemedText>{t('puja.intro')}</ThemedText>
      <ThemedText type="caption">{t('puja.familyOnly')}</ThemedText>
      {!configured || services.length === 0 ? (
        <StatusBlock
          status="unavailable"
          title={t('status.unavailableTitle')}
          body={t('puja.empty')}
          placeholderLabel={t('status.placeholder')}
        />
      ) : (
        services.map((service) => (
          <SectionCard
            key={service.id}
            title={service.title}
            detail={formatInr(service.pricePaise)}
          >
            <ThemedText>{service.description}</ThemedText>
            <ThemedText type="caption">
              {t('puja.duration')}: {service.durationMinutes}
            </ThemedText>
            <ThemedText type="caption">
              {t('puja.advance')}: {service.minAdvanceHours}
            </ThemedText>
            <ChoiceRow
              label={t('puja.book')}
              selected={false}
              onPress={() => onOpenService(service.id)}
            />
          </SectionCard>
        ))
      )}
      <ChoiceRow label={t('puja.bookings')} selected={false} onPress={onOpenBookings} />
    </Screen>
  );
}
