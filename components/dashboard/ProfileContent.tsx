import React from 'react';
import { Image, Text, View } from 'react-native';
import { MapPin, ShieldCheck, GraduationCap } from 'lucide-react-native';
import type { LimitedProfile } from '../../feature/dashboard/shared/apis/publicProfileApi';
import { InfoGrid, RecordSection, StatusBadge } from '../Ui/RecordLayout';
import { createThemedStyles, useTheme } from '../Ui/theme';
import TeacherBookingDates from './TeacherBookingDates';
import ReviewHistory from './ReviewHistory';
import ContentPreview from '../Ui/ContentPreview';

export default function ProfileContent({
  profile,
  compact = false,
  reviews = false,
}: {
  profile: LimitedProfile;
  compact?: boolean;
  reviews?: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const initials = profile.title
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const teacher = profile.reviewType === 'instructor';
  function tags(title: string, values?: string[]) {
    if (!values?.length) return null;
    return (
      <View style={styles.tagSection}>
        <Text style={styles.label}>{title}</Text>
        <View style={styles.tags}>
          {values.map(value => (
            <View key={value} style={styles.tag}>
              <Text style={styles.tagText}>{value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }
  return (
    <View style={styles.content}>
      <View style={[styles.hero, compact && styles.compactHero]}>
        <View style={styles.identity}>
          {profile.imageUrl && /^https?:|^data:/.test(profile.imageUrl) ? (
            <Image
              source={{ uri: profile.imageUrl }}
              style={[styles.avatar, compact && styles.smallAvatar]}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarEmpty,
                compact && styles.smallAvatar,
              ]}
            >
              <Text style={styles.initials}>{initials}</Text>
            </View>
          )}
          <View style={styles.identityCopy}>
            <Text
              accessibilityRole="header"
              style={[styles.name, compact && styles.smallName]}
            >
              {profile.title}
            </Text>
            <Text style={styles.subtitle}>{profile.subtitle}</Text>
            {profile.location ? (
              <View style={styles.location}>
                <MapPin size={14} color={colors.muted} />
                <ContentPreview
                  text={profile.location}
                  title="Location"
                  threshold={90}
                  lines={2}
                  style={styles.locationText}
                />
              </View>
            ) : null}
          </View>
        </View>
        {!compact ? (
          <View style={styles.verification}>
            <ShieldCheck
              size={18}
              color={profile.verified ? '#18745b' : colors.muted}
            />
            <StatusBadge
              status={profile.verified ? 'VERIFIED' : 'PENDING'}
              label={
                profile.verified
                  ? teacher
                    ? 'DBS verified'
                    : 'Verified school'
                  : teacher
                  ? 'DBS verification not confirmed'
                  : 'Verification not confirmed'
              }
            />
          </View>
        ) : profile.verified ? (
          <StatusBadge
            status="VERIFIED"
            label={teacher ? 'DBS verified' : 'Verified school'}
          />
        ) : null}
        {!compact && profile.facts ? (
          <View style={styles.facts}>
            <InfoGrid items={profile.facts} />
          </View>
        ) : null}
      </View>
      {!compact ? (
        <>
          <RecordSection
            title={teacher ? 'About the teacher' : 'Staffing needs'}
            subtitle={
              teacher ? undefined : 'What this school looks for when hiring'
            }
          >
            <ContentPreview
              title={teacher ? 'About the teacher' : 'School staffing needs'}
              text={
                profile.about ||
                (teacher
                  ? 'An introduction has not been added yet.'
                  : 'This school has not shared a public staffing summary yet.')
              }
              style={styles.body}
            />
          </RecordSection>
          {teacher ? (
            <RecordSection
              title="Teaching expertise"
              action={<GraduationCap size={22} color={colors.brandDark} />}
            >
              {tags('Subjects', profile.subjects)}
              {tags('Key stages', profile.keyStages)}
              {tags('Skills & specialisms', profile.skills)}
              {!profile.subjects?.length &&
              !profile.skills?.length &&
              !profile.keyStages?.length ? (
                <Text style={styles.body}>
                  Teaching details have not been added yet.
                </Text>
              ) : null}
            </RecordSection>
          ) : (
            <RecordSection
              title="Cover opportunities"
              subtitle="The teaching cover this school books"
            >
              {profile.tags?.length ? (
                tags('Cover types', profile.tags)
              ) : (
                <Text style={styles.body}>
                  Cover preferences have not been shared.
                </Text>
              )}
            </RecordSection>
          )}
          {teacher ? (
            <RecordSection
              title="Availability"
              subtitle="Existing placements help you plan your next booking."
            >
              <TeacherBookingDates periods={profile.bookings} />
            </RecordSection>
          ) : null}
          {!teacher ? (
            <RecordSection
              title="School overview"
              subtitle="Details to help you plan your placement"
            >
              <InfoGrid items={profile.overview || []} />
              <View style={styles.tagSection}>
                <Text style={styles.label}>School address</Text>
                <ContentPreview
                  text={profile.location || 'Location not shared'}
                  title="School address"
                  threshold={100}
                  lines={3}
                  style={styles.body}
                />
              </View>
            </RecordSection>
          ) : profile.details?.length ? (
            <RecordSection title="Professional details">
              {profile.details.map(detail => (
                <ContentPreview
                  key={detail}
                  text={detail}
                  title="Professional details"
                  style={styles.body}
                />
              ))}
            </RecordSection>
          ) : null}
          {reviews && profile.reviewType ? (
            <RecordSection title="Reviews & feedback">
              <ReviewHistory id={profile.id} type={profile.reviewType} />
            </RecordSection>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
const useStyles = createThemedStyles(colors => ({
  content: { gap: 18 },
  hero: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 22,
    gap: 18,
  },
  compactHero: { padding: 0, borderWidth: 0, borderRadius: 0, gap: 10 },
  identity: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  identityCopy: { flex: 1, gap: 6 },
  avatar: {
    height: 80,
    width: 80,
    borderRadius: 24,
    backgroundColor: colors.brandTint,
  },
  smallAvatar: { height: 52, width: 52, borderRadius: 17 },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 23, fontWeight: '800', color: colors.brandDark },
  name: {
    color: colors.ink,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  smallName: { fontSize: 17, lineHeight: 24 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  location: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  locationText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  verification: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  facts: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 18 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 24 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  tagSection: { gap: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  tag: {
    backgroundColor: colors.brandTint,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tagText: { color: colors.brandDark, fontSize: 12 },
}));
