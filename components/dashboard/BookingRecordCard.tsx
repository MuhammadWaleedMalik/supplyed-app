import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  CalendarDays,
  MapPin,
  ChevronDown,
  ChevronUp,
  BriefcaseBusiness,
} from 'lucide-react-native';
import type { Booking } from '../../feature/dashboard/shared/apis/bookingsApi';
import { displayDate, displayPay } from '../../utils/ui/marketplaceLabels';
import { plannedLabel } from '../../utils/jobs/workSchedule';
import { StatusBadge, Notice } from '../Ui/RecordLayout';
import ContentPreview from '../Ui/ContentPreview';
import { createThemedStyles, useTheme } from '../Ui/theme';

export default function BookingRecordCard({
  booking,
  partyName,
  onProfile,
  children,
  footer,
}: {
  booking: Booking;
  partyName: string;
  onProfile: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [wide, setWide] = useState(false);
  const [open, setOpen] = useState(false);
  const location = [
    booking.job.address,
    booking.job.city,
    booking.job.county,
    booking.job.postalCode,
  ]
    .filter(Boolean)
    .join(', ');
  return (
    <View
      onLayout={event => setWide(event.nativeEvent.layout.width >= 540)}
      style={styles.card}
    >
      <View style={styles.topLine}>
        <Text style={styles.eyebrow}>
          BOOKING ·{' '}
          {booking.source === 'DIRECT_HIRE'
            ? 'DIRECT INVITATION'
            : 'APPLICATION'}
        </Text>
        <StatusBadge status={booking.status} />
      </View>
      <View style={[styles.columns, wide && styles.wide]}>
        <View style={[styles.main, wide && styles.mainWide]}>
          <Text accessibilityRole="header" style={styles.title}>
            {booking.job.title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${partyName} profile`}
            onPress={onProfile}
            style={styles.profile}
          >
            <Text style={styles.person}>{partyName}</Text>
            <Text style={styles.profileHint}>View profile →</Text>
          </Pressable>
          <View style={styles.schedule}>
            <View style={styles.icon}>
              <CalendarDays size={20} color={colors.brandDark} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.label}>PLACEMENT DATES</Text>
              <Text style={styles.value}>{displayDate(booking.startDate)}</Text>
              <Text style={styles.subtle}>
                to {displayDate(booking.endDate)} · UK time
              </Text>
            </View>
          </View>
          <View style={styles.location}>
            <MapPin size={18} color={colors.muted} />
            <ContentPreview
              text={location || 'Location not provided'}
              title="Booking address"
              threshold={90}
              lines={2}
              style={styles.address}
            />
          </View>
          {booking.cancelReason ? (
            <Notice
              danger
              text={`Cancellation reason\n${booking.cancelReason}`}
            />
          ) : null}
          {booking.job.parkingInfo ? (
            <ContentPreview
              text={`Parking · ${booking.job.parkingInfo}`}
              title="Parking information"
              threshold={160}
              lines={3}
              style={styles.subtle}
            />
          ) : null}
        </View>
        <View style={[styles.side, wide && styles.sideWide]}>
          <View style={styles.pay}>
            <Text style={styles.label}>AGREED PAY</Text>
            <Text style={styles.amount}>
              {displayPay(booking.payAmount, booking.payType)}
            </Text>
            <View style={styles.location}>
              <BriefcaseBusiness size={14} color={colors.muted} />
              <Text style={styles.subtle}>{plannedLabel(booking)}</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            onPress={() => setOpen(current => !current)}
            style={styles.manage}
          >
            <Text style={styles.manageText}>
              {open ? 'Hide booking actions' : 'Manage booking'}
            </Text>
            {open ? (
              <ChevronUp size={18} color={colors.brandDark} />
            ) : (
              <ChevronDown size={18} color={colors.brandDark} />
            )}
          </Pressable>
          {open ? <View style={styles.actions}>{children}</View> : null}
        </View>
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}
const useStyles = createThemedStyles(colors => ({
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
    gap: 20,
  },
  topLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    alignItems: 'center',
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  columns: { gap: 20 },
  wide: { flexDirection: 'row', alignItems: 'flex-start' },
  main: { gap: 16 },
  mainWide: { flex: 1 },
  title: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  profile: { gap: 4, minHeight: 44, justifyContent: 'center' },
  person: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  profileHint: { color: colors.brandDark, fontSize: 12 },
  schedule: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { backgroundColor: colors.brandTint, padding: 12, borderRadius: 14 },
  copy: { flex: 1, gap: 3 },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  value: { color: colors.ink, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  subtle: { color: colors.muted, fontSize: 12, lineHeight: 19, flexShrink: 1 },
  location: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  address: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  side: {
    padding: 16,
    backgroundColor: colors.soft,
    borderRadius: 16,
    gap: 14,
  },
  sideWide: { width: 210 },
  pay: { gap: 7 },
  amount: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
  },
  manage: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  manageText: {
    flexShrink: 1,
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: '700',
  },
  actions: { gap: 10 },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 },
}));
