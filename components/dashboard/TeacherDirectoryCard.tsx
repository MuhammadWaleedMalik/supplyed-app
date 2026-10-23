import React from 'react';
import { Image, Text, View } from 'react-native';
import { MapPin, Star } from 'lucide-react-native';
import { DirectoryTeacher } from '../../feature/dashboard/school/apis/teachersApi';
import { bookingPeriodLabel } from '../../utils/jobs/teacherSchedule';
import { createThemedStyles, useTheme } from '../Ui/theme';
import Button from '../Ui/Button';

type Props = {
  teacher: DirectoryTeacher;
  onProfile: () => void;
  onInvite: () => void;
};

function money(amount: number, currency: string | null) {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'GBP',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return (currency || 'GBP') + ' ' + amount;
  }
}

export default function TeacherDirectoryCard({
  teacher,
  onProfile,
  onInvite,
}: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const initials = teacher.fullName
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const tags = Array.from(
    new Set([...(teacher.subjects || []), ...(teacher.keyStages || [])]),
  ).slice(0, 3);
  const bookings = teacher.bookings;
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {teacher.imageUrl && /^https?:/.test(teacher.imageUrl) ? (
          <Image source={{ uri: teacher.imageUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials || 'T'}</Text>
          </View>
        )}
        <View style={styles.copy}>
          <Text style={styles.name} numberOfLines={2}>
            {teacher.fullName}
          </Text>
          <View style={styles.metaRow}>
            <MapPin size={13} color={colors.muted} />
            <Text style={styles.meta} numberOfLines={1}>
              {[teacher.city, teacher.county].filter(Boolean).join(', ') ||
                'Location not provided'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.badges}>
        {teacher.dbsVerified ? (
          <Text style={styles.verified}>DBS verified</Text>
        ) : null}
        {teacher.qtsQualified ? <Text style={styles.tag}>QTS</Text> : null}
        {teacher.availableToday ? (
          <Text style={styles.verified}>Available today</Text>
        ) : null}
        {teacher.match ? (
          <Text style={styles.tag}>
            {Math.round(teacher.match.score)}% match
          </Text>
        ) : null}
      </View>
      <View style={styles.metaRow}>
        <Star size={14} color={colors.brandDark} />
        <Text style={styles.meta}>
          {teacher.ratingCount
            ? `${teacher.ratingAverage.toFixed(1)} (${teacher.ratingCount})`
            : 'No reviews yet'}
          {teacher.experience != null
            ? ` · ${teacher.experience} years experience`
            : ''}
        </Text>
      </View>
      {tags.length ? (
        <Text style={styles.subjects} numberOfLines={2}>
          {tags.join(' · ')}
        </Text>
      ) : null}
      {teacher.dailyRate != null || teacher.hourlyRate != null ? (
        <Text style={styles.rate}>
          {[
            teacher.dailyRate != null
              ? money(teacher.dailyRate, teacher.currency) + ' / day'
              : '',
            teacher.hourlyRate != null
              ? money(teacher.hourlyRate, teacher.currency) + ' / hour'
              : '',
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      ) : null}
      <Text style={styles.meta} numberOfLines={2}>
        {bookings == null
          ? 'Booking dates unavailable'
          : bookings.length
          ? 'Booked: ' +
            bookingPeriodLabel(bookings[0]) +
            (bookings.length > 1 ? ` +${bookings.length - 1} more` : '')
          : 'No confirmed upcoming bookings'}
      </Text>
      {teacher.match?.flags.scheduleConflict ? (
        <Text style={styles.warning}>A booking overlaps this job’s dates.</Text>
      ) : null}
      <View style={styles.actions}>
        <View style={styles.action}>
          <Button title="View profile" variant="outline" onPress={onProfile} />
        </View>
        <View style={styles.action}>
          <Button title="Invite" onPress={onInvite} />
        </View>
      </View>
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, gap: 4 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: colors.brandDark, fontSize: 17, fontWeight: '700' },
  name: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { color: colors.muted, fontSize: 12, lineHeight: 18, flexShrink: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  verified: {
    color: '#187048',
    backgroundColor: '#edf8f2',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '600',
  },
  tag: {
    color: colors.brandDark,
    backgroundColor: colors.brandTint,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '600',
  },
  subjects: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  rate: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  warning: { color: '#975510', fontSize: 12, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10, paddingTop: 2 },
  action: { flex: 1 },
}));
