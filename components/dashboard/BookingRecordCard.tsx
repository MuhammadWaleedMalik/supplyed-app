import React, { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
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
import RichText from '../Ui/RichText';
import { createThemedStyles, useTheme } from '../Ui/theme';

export default function BookingRecordCard({
  booking,
  partyName,
  onProfile,
  children,
  footer,
  topActions,
  detailMode = false,
  hideManage = false,
}: {
  booking: Booking;
  partyName: string;
  onProfile: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  topActions?: React.ReactNode;
  detailMode?: boolean;
  hideManage?: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const [cardWidth, setCardWidth] = useState(0);
  const wide = cardWidth / Math.max(fontScale, 1) >= 540;
  const [open, setOpen] = useState(false);
  const location = [
    booking.job.address,
    booking.job.city,
    booking.job.county,
    booking.job.postalCode,
  ]
    .filter(Boolean)
    .join(', ');

  if (detailMode) {
    return (
      <View style={styles.detailPage}>
        <View style={styles.detailSection}>
          <View style={styles.topLine}>
            <Text style={styles.eyebrow}>
              BOOKING Â·{' '}
              {booking.source === 'DIRECT_HIRE'
                ? 'JOB INVITATION'
                : 'APPLICATION'}
            </Text>
            <StatusBadge status={booking.status} />
          </View>
          {topActions ? (
            <View style={styles.detailActions}>{topActions}</View>
          ) : null}
        </View>

        <Notice
          text={
            booking.termsStatus !== 'RECORDED'
              ? 'Historical booking: some original details were not recorded. Confirm missing information with the school.'
              : 'These are the agreed booking terms saved at confirmation.'
          }
        />

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Placement overview</Text>
          <ContentPreview
            accessibilityRole="header"
            title="Booked role"
            text={booking.job.title}
            style={styles.title}
            lines={3}
          />
          {booking.job.description ? (
            <RichText value={booking.job.description} />
          ) : null}
          {booking.job.subjects?.length || booking.job.keyStages?.length ? (
            <Text style={styles.subtle}>
              {[
                ...(booking.job.subjects || []),
                ...(booking.job.keyStages || []),
              ].join(' Â· ')}
            </Text>
          ) : null}
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>
            {booking.source === 'DIRECT_HIRE' ? 'School or teacher' : 'People'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${partyName} profile`}
            onPress={onProfile}
            style={styles.detailProfile}
          >
            <View style={styles.profileCopy}>
              <Text style={styles.person}>{partyName}</Text>
              <Text style={styles.subtle}>Booking contact</Text>
            </View>
            <Text style={styles.profileHint}>View profile â†’</Text>
          </Pressable>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Schedule and location</Text>
          <View style={styles.detailFact}>
            <View style={styles.icon}>
              <CalendarDays size={20} color={colors.brandDark} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.label}>PLACEMENT DATES</Text>
              <Text style={styles.value}>
                {displayDate(booking.startDate)} to{' '}
                {displayDate(booking.endDate)}
              </Text>
              <Text style={styles.subtle}>Europe/London time</Text>
            </View>
          </View>
          <View style={styles.detailFact}>
            <View style={styles.icon}>
              <MapPin size={20} color={colors.brandDark} />
            </View>
            <ContentPreview
              text={location || 'Location not provided'}
              title="Booking address"
              threshold={90}
              lines={3}
              style={styles.address}
            />
          </View>
          {booking.job.parkingInfo ? (
            <ContentPreview
              text={booking.job.parkingInfo}
              title="Parking information"
              threshold={160}
              lines={3}
              style={styles.subtle}
            />
          ) : null}
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Agreed pay</Text>
          <Text style={styles.amount}>
            {displayPay(booking.payAmount, booking.payType)}
          </Text>
          <View style={styles.location}>
            <BriefcaseBusiness size={17} color={colors.muted} />
            <Text style={styles.subtle}>{plannedLabel(booking)}</Text>
          </View>
        </View>

        {booking.cancelReason ? (
          <Notice danger text={`Cancellation reason\n${booking.cancelReason}`} />
        ) : null}

        {children ? (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Booking controls</Text>
            <View style={styles.actions}>{children}</View>
          </View>
        ) : null}

        {footer ? <View style={styles.detailSection}>{footer}</View> : null}
      </View>
    );
  }

  return (
    <View
      onLayout={event => setCardWidth(event.nativeEvent.layout.width)}
      style={styles.card}
    >
      <View style={styles.topLine}>
        <Text style={styles.eyebrow}>
          BOOKING ·{' '}
          {booking.source === 'DIRECT_HIRE'
            ? 'JOB INVITATION'
            : 'APPLICATION'}
        </Text>
        <StatusBadge status={booking.status} />
      </View>
      {topActions ? <View style={styles.topActions}>{topActions}</View> : null}
      <Notice
        text={
          booking.termsStatus !== 'RECORDED'
            ? 'Historical booking: the original pay and dates are shown. A complete agreed location and role snapshot was not recorded; confirm missing details with the school.'
            : 'These are the agreed booking terms saved at confirmation.'
        }
      />
      <View style={[styles.columns, wide && styles.wide]}>
        <View style={[styles.main, wide && styles.mainWide]}>
          <ContentPreview accessibilityRole="header" title="Booked role" text={booking.job.title} style={styles.title} lines={3} />
          {booking.job.description ? (
            <RichText value={booking.job.description} />
          ) : null}
          {booking.job.subjects?.length || booking.job.keyStages?.length ? (
            <Text style={styles.subtle}>
              {[
                ...(booking.job.subjects || []),
                ...(booking.job.keyStages || []),
              ].join(' · ')}
            </Text>
          ) : null}
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
          {!hideManage ? <Pressable
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
          </Pressable> : null}
          {hideManage || open ? <View style={styles.actions}>{children}</View> : null}
        </View>
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}
const useStyles = createThemedStyles(colors => ({
  detailPage: { gap: 14 },
  detailSection: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  detailActions: { gap: 10, paddingTop: 2 },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '800',
  },
  detailProfile: {
    minHeight: 58,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.soft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  profileCopy: { flex: 1, minWidth: 0, gap: 3 },
  detailFact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.soft,
  },
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
  topActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
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
