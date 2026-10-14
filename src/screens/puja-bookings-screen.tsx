import { ChoiceRow } from '@/components/choice-row';
import { Screen } from '@/components/screen';
import { SectionCard } from '@/components/section-card';
import { StatusBlock } from '@/components/status-block';
import { ThemedText } from '@/components/themed-text';
import { formatInTimeZone, type CustomerBookingView } from '@/modules/puja';
import { useApp } from '@/providers/app-provider';

const STATUS_KEYS = {
  pending_payment: 'puja.status.pending_payment',
  pending_assignment: 'puja.status.pending_assignment',
  confirmed: 'puja.status.confirmed',
  rescheduled: 'puja.status.rescheduled',
  cancelled: 'puja.status.cancelled',
  in_progress: 'puja.status.in_progress',
  completed: 'puja.status.completed',
  no_show: 'puja.status.no_show',
  refund_pending: 'puja.status.refund_pending',
  refunded: 'puja.status.refunded',
} as const;

export function PujaBookingsScreen({
  signedIn,
  bookings,
  onJoin,
  onReview,
  onSavePriest,
}: {
  signedIn: boolean;
  bookings: readonly CustomerBookingView[];
  onJoin: (bookingId: string) => void;
  onReview: (bookingId: string) => void;
  onSavePriest: (bookingId: string) => void;
}) {
  const { t } = useApp();
  if (!signedIn) {
    return (
      <Screen>
        <ThemedText>{t('puja.signIn')}</ThemedText>
      </Screen>
    );
  }
  return (
    <Screen>
      <ThemedText>{t('puja.paymentNote')}</ThemedText>
      {bookings.length === 0 ? (
        <StatusBlock
          status="empty"
          title={t('status.emptyTitle')}
          body={t('puja.empty')}
          placeholderLabel={t('status.placeholder')}
        />
      ) : (
        bookings.map((booking) => (
          <SectionCard key={booking.bookingId} title={booking.title}>
            <ThemedText>{t(STATUS_KEYS[booking.status])}</ThemedText>
            <ThemedText type="caption">
              {formatInTimeZone(new Date(booking.startsAt), booking.timeZone)} ({booking.timeZone})
            </ThemedText>
            {booking.assignedPriestName ? (
              <ThemedText>{t('puja.priestAssigned')}</ThemedText>
            ) : null}
            {booking.preferredUnavailable ? <ThemedText>{t('puja.fallback')}</ThemedText> : null}
            {booking.status === 'confirmed' ||
            booking.status === 'rescheduled' ||
            booking.status === 'in_progress' ? (
              <ChoiceRow
                label={t('puja.session')}
                selected={false}
                onPress={() => onJoin(booking.bookingId)}
              />
            ) : null}
            {booking.status === 'completed' ? (
              <>
                <ChoiceRow
                  label={t('puja.review')}
                  selected={false}
                  onPress={() => onReview(booking.bookingId)}
                />
                <ChoiceRow
                  label={t('puja.savePriest')}
                  selected={false}
                  onPress={() => onSavePriest(booking.bookingId)}
                />
              </>
            ) : null}
          </SectionCard>
        ))
      )}
    </Screen>
  );
}
