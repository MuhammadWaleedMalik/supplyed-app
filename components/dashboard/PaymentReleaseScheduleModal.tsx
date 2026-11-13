import React, { useMemo } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import type { Booking } from '../../feature/dashboard/shared/apis/bookingsApi';
import { buildPaymentReleasePreview } from '../../utils/jobs/paymentReleaseSchedule';
import Button from '../Ui/Button';
import { createThemedStyles, useTheme } from '../Ui/theme';

const PERIOD_SEPARATOR_STYLE = { height: 11 } as const;

function date(value?: string | null, timezone = 'Europe/London') {
  if (!value) return 'Unavailable';
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(value + 'T12:00:00Z')
    : new Date(value);
  return Number.isFinite(parsed.getTime())
    ? parsed.toLocaleDateString('en-GB', {
        timeZone: timezone,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : value;
}

function dateTime(value: string, timezone: string) {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    ? parsed.toLocaleString('en-GB', {
        timeZone: timezone,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : value;
}

function PeriodSeparator() {
  return <View style={PERIOD_SEPARATOR_STYLE} />;
}

export default function PaymentReleaseScheduleModal({
  booking,
  visible,
  onClose,
}: {
  booking: Booking;
  visible: boolean;
  onClose: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const preview = useMemo(() => buildPaymentReleasePreview(booking), [booking]);
  const frequency =
    preview.frequency.charAt(0).toUpperCase() + preview.frequency.slice(1);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent={false}
      navigationBarTranslucent={false}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>PAYMENT PREVIEW</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Estimated payment release schedule
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close payment release schedule"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [
              styles.close,
              pressed && styles.closePressed,
            ]}
          >
            <X size={23} color={colors.ink} />
          </Pressable>
        </View>
        <FlatList
          data={preview.state === 'ready' ? preview.periods : []}
          keyExtractor={period => period.key}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={PeriodSeparator}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.bookingTitle}>{preview.bookingTitle}</Text>
              <View style={styles.summary}>
                <View style={styles.summaryItem}>
                  <Text style={styles.label}>ASSIGNMENT DATES</Text>
                  <Text style={styles.value}>
                    {date(preview.assignmentStart, preview.timezone)} to{' '}
                    {date(preview.assignmentEnd, preview.timezone)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.label}>PAYMENT FREQUENCY</Text>
                  <Text style={styles.value}>{frequency}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.label}>BOOKING TIMEZONE</Text>
                  <Text style={styles.value}>{preview.timezone}</Text>
                </View>
              </View>
              <View style={styles.notice}>
                <Text style={styles.noticeText}>
                  Estimate assuming all scheduled shifts are marked present.
                  Actual collection depends on attendance confirmation, payment
                  settings and processing. These dates are not guaranteed bank
                  payout dates.
                </Text>
              </View>
            </View>
          }
          renderItem={({ item: period }) => (
            <View style={styles.period}>
              <Text style={styles.periodTitle}>{period.label}</Text>
              <View style={styles.row}>
                <Text style={styles.label}>WORKING DATES</Text>
                <Text style={styles.value}>
                  {period.workingDates
                    .map(value => date(value, preview.timezone))
                    .join(', ')}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>ESTIMATED ELIGIBILITY</Text>
                <Text style={styles.value}>
                  {dateTime(period.eligibilityAt, preview.timezone)}
                  {period.conditionalOnCompletion
                    ? ' · after the booking is marked completed'
                    : ''}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>SCHEDULED WORK</Text>
                <Text style={styles.value}>
                  {period.workingDates.length}{' '}
                  {period.workingDates.length === 1
                    ? 'working day'
                    : 'working days'}
                  {' · '}
                  {period.shiftCount}{' '}
                  {period.shiftCount === 1 ? 'shift' : 'shifts'}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {preview.state === 'empty'
                  ? 'No scheduled payments to display'
                  : 'Schedule unavailable'}
              </Text>
              {preview.state !== 'empty' && preview.message ? (
                <Text style={styles.emptyText}>{preview.message}</Text>
              ) : null}
            </View>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              <Button title="Close" onPress={onClose} />
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const useStyles = createThemedStyles(colors => ({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#ffffff',
  },
  headerCopy: { flex: 1, minWidth: 0, gap: 4 },
  close: {
    width: 48,
    height: 48,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.soft,
  },
  closePressed: { opacity: 0.65 },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 36,
  },
  listHeader: { gap: 16, marginBottom: 11 },
  eyebrow: {
    color: colors.brandDark,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  title: { color: colors.ink, fontSize: 22, lineHeight: 29, fontWeight: '800' },
  bookingTitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  summary: {
    padding: 14,
    gap: 11,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    borderRadius: 14,
    backgroundColor: colors.soft,
  },
  summaryItem: { gap: 2 },
  label: { color: colors.muted, fontSize: 10, lineHeight: 15, fontWeight: '800' },
  value: { color: colors.ink, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  notice: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#ead7a2',
    borderRadius: 14,
    backgroundColor: '#fff9e8',
  },
  noticeText: { color: colors.ink, fontSize: 13, lineHeight: 20 },
  period: {
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    borderRadius: 14,
    backgroundColor: '#ffffff',
  },
  periodTitle: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  row: { gap: 2 },
  empty: {
    padding: 18,
    gap: 6,
    borderRadius: 14,
    backgroundColor: colors.soft,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  emptyText: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  footer: { paddingTop: 16 },
}));
