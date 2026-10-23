import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Mail,
} from 'lucide-react-native';
import { useDashboardSummary } from '../../feature/dashboard/shared/hooks/useDashboardSummary';
import { invitationStatus } from '../../feature/dashboard/shared/apis/invitationsApi';
import { useAppDispatch } from '../../store/hooks';
import {
  openBooking,
  openInvitation,
  showPage,
} from '../../feature/dashboard/shared/store/navigationSlice';
import { londonDate, listingStatus } from '../../utils/jobs/londonTime';
import { displayDate, displayPay } from '../../utils/ui/marketplaceLabels';
import Button from '../Ui/Button';
import AppIcon, { AppIconName } from '../Ui/AppIcon';
import { createThemedStyles, useTheme } from '../Ui/theme';
import { useStyles } from './dashboardStyles';

export default function DashboardSummary({
  role,
}: {
  role: 'school' | 'teacher';
}) {
  const styles = useStyles();
  const home = useHomeStyles();
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const data = useDashboardSummary(role);
  const teacher = role === 'teacher';
  const today = londonDate();
  const nextBooking = data.errors.Bookings
    ? undefined
    : data.bookings
        ?.filter(
          item =>
            item.startDate &&
            londonDate(new Date(item.endDate || item.startDate)) >= today,
        )
        .sort((a, b) =>
          (a.startDate || '').localeCompare(b.startDate || ''),
        )[0];
  const pending = data.errors.Invitations
    ? []
    : data.invitations?.filter(item => invitationStatus(item) === 'PENDING') ||
      [];
  const applicationCount = data.applications?.filter(item =>
    ['APPLIED', 'VIEWED', 'SHORTLISTED'].includes(item.status),
  ).length;
  const activeJobs = data.jobs?.filter(
    job => listingStatus(job) === 'LIVE',
  ).length;
  const firstName = data.profile?.user.name?.trim().split(/\s+/)[0];
  const shortcuts: {
    title: string;
    detail: string;
    icon: AppIconName;
    page: 'Applications' | 'Invitations' | 'Billing';
  }[] = [
    {
      title: 'Applications',
      detail: teacher ? 'Track your progress' : 'Review your applicants',
      icon: 'applications',
      page: 'Applications',
    },
    {
      title: 'Invitations',
      detail: teacher ? 'Offers from schools' : 'Sent offers and responses',
      icon: 'invitations',
      page: 'Invitations',
    },
    {
      title: teacher ? 'Earnings' : 'Billing',
      detail: teacher ? 'Invoices and payouts' : 'Invoices and payments',
      icon: 'billing',
      page: 'Billing',
    },
  ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.page}
      refreshControl={
        <RefreshControl
          refreshing={data.loading && !!data.profile}
          onRefresh={data.refresh}
          tintColor={colors.brand}
        />
      }
    >
      <View style={home.welcome}>
        <Text style={home.date}>
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            timeZone: 'Europe/London',
          })}
        </Text>
        <Text style={styles.title}>
          {firstName ? `Hello, ${firstName}` : 'Welcome back'}
        </Text>
        <Text style={styles.subtitle}>
          {teacher
            ? 'Your next teaching day starts here.'
            : 'Great teaching starts with the right people.'}
        </Text>
      </View>
      <View style={home.hero}>
        <View style={styles.sectionHead}>
          <Text style={home.heroTitle}>
            {teacher ? 'Find your next role' : 'Find your next teacher'}
          </Text>
          <ArrowUpRight color={colors.brandDark} size={26} />
        </View>
        <Text style={styles.cardBody}>
          {teacher
            ? 'Explore opportunities that fit your skills and schedule.'
            : 'Explore profiles and invite a teacher to a job.'}
        </Text>
        <Button
          title={teacher ? 'Browse jobs' : 'Find teachers'}
          onPress={() => dispatch(showPage(teacher ? 'Jobs' : 'Teachers'))}
        />
      </View>

      <View style={home.stats}>
        <Pressable
          accessibilityRole="button"
          onPress={() => dispatch(showPage(teacher ? 'Applications' : 'Jobs'))}
          style={home.stat}
        >
          <Text style={home.statValue}>
            {data.errors[teacher ? 'Applications' : 'Jobs']
              ? '—'
              : (teacher ? applicationCount : activeJobs) ?? '—'}
          </Text>
          <Text style={styles.cardBody}>
            {teacher ? 'Applications in progress' : 'Live jobs'}
          </Text>
          <Text style={home.statLink}>
            {teacher ? 'View applications' : 'Manage jobs'} →
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => dispatch(showPage('Invitations'))}
          style={home.stat}
        >
          <Text style={home.statValue}>
            {data.errors.Invitations || !data.invitations
              ? '—'
              : pending.length}
          </Text>
          <Text style={styles.cardBody}>
            {teacher ? 'Invitations to review' : 'Awaiting a response'}
          </Text>
          <Text style={home.statLink}>View invitations →</Text>
        </Pressable>
      </View>

      {pending.length ? (
        <View style={styles.section}>
          <View style={home.sectionHead}>
            <Mail size={20} color={colors.brand} />
            <Text style={styles.cardTitle}>
              {teacher ? 'An offer for you' : 'Awaiting a response'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Review invitation for ${pending[0].job.title}`}
            style={home.offer}
            onPress={() => dispatch(openInvitation(pending[0].id))}
          >
            <View style={styles.teacherCopy}>
              <Text style={styles.cardTitle}>{pending[0].job.title}</Text>
              <Text style={styles.cardBody}>
                {teacher
                  ? pending[0].institution.name
                  : pending[0].instructor.fullName}
              </Text>
              <Text style={home.statLink}>
                {teacher ? 'Respond by ' : 'Response due '}
                {displayDate(pending[0].expiresAt)}
              </Text>
            </View>
            <ChevronRight size={22} color={colors.brand} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={home.sectionHead}>
          <CalendarDays size={20} color={colors.brand} />
          <Text style={styles.cardTitle}>Your next booking</Text>
        </View>
        {nextBooking ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View booking ${nextBooking.job.title}`}
            style={styles.card}
            onPress={() => dispatch(openBooking(nextBooking.id))}
          >
            <Text style={home.date}>{displayDate(nextBooking.startDate)}</Text>
            <Text style={styles.cardTitle}>{nextBooking.job.title}</Text>
            <Text style={styles.cardBody}>
              {teacher
                ? nextBooking.institution.name
                : nextBooking.instructor.fullName}
            </Text>
            <Text style={styles.cardBody}>
              {nextBooking.job.city || 'Location not provided'} ·{' '}
              {displayPay(nextBooking.payAmount, nextBooking.payType)}
            </Text>
            <Text style={home.statLink}>View booking details →</Text>
          </Pressable>
        ) : !data.loading && !data.errors.Bookings ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your schedule is clear</Text>
            <Text style={styles.cardBody}>
              Confirmed bookings will appear here.
            </Text>
          </View>
        ) : data.loading && !data.bookings ? (
          <ActivityIndicator
            color={colors.brand}
            accessibilityLabel="Loading your schedule"
          />
        ) : null}
      </View>

      <View style={home.links}>
        {shortcuts.map(item => (
          <Pressable
            key={item.page}
            accessibilityRole="button"
            style={home.link}
            onPress={() => dispatch(showPage(item.page))}
          >
            <View style={home.linkIcon}>
              <AppIcon name={item.icon} color={colors.brand} size={22} />
            </View>
            <View style={styles.teacherCopy}>
              <Text style={styles.teacherName}>{item.title}</Text>
              <Text style={styles.cardBody}>{item.detail}</Text>
            </View>
            <ChevronRight size={20} color={colors.muted} />
          </Pressable>
        ))}
      </View>
      {Object.keys(data.errors).length ? (
        <View style={styles.card}>
          <Text accessibilityRole="alert" style={styles.cardBody}>
            {Object.keys(data.errors).join(', ')} could not be refreshed. Your
            other sections are still available.
          </Text>
          <Button
            title="Try again"
            variant="link"
            disabled={data.loading}
            onPress={data.refresh}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const useHomeStyles = createThemedStyles(colors => ({
  welcome: { gap: 6 },
  date: { color: colors.brandDark, fontSize: 13, fontWeight: '600' },
  hero: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.brandTint,
    gap: 14,
  },
  heroTitle: {
    flex: 1,
    color: colors.brandDark,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '700',
  },
  stats: { flexDirection: 'row', gap: 12 },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    gap: 6,
  },
  statValue: { fontSize: 28, fontWeight: '700', color: colors.ink },
  statLink: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.brandDark,
  },
  sectionHead: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  offer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.brand,
    backgroundColor: '#fff',
  },
  links: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    minHeight: 76,
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
