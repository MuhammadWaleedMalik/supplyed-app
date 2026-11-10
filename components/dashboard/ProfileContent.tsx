import React, { useEffect, useState } from 'react';
import { Image, Linking, Text, View } from 'react-native';
import {
  FileText,
  GraduationCap,
  MapPin,
  ShieldCheck,
} from 'lucide-react-native';
import type { LimitedProfile } from '../../feature/dashboard/shared/apis/publicProfileApi';
import { InfoGrid, RecordSection, StatusBadge } from '../Ui/RecordLayout';
import { createThemedStyles, useTheme } from '../Ui/theme';
import TeacherBookingDates from './TeacherBookingDates';
import ReviewHistory from './ReviewHistory';
import ContentPreview from '../Ui/ContentPreview';
import Button from '../Ui/Button';
import InstitutionJobsSection from './InstitutionJobsSection';

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
  const [documentError, setDocumentError] = useState('');
  useEffect(() => setDocumentError(''), [profile.id]);
  const initials = profile.title
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const teacher = profile.reviewType === 'instructor';
  async function openDocument(url: string | null) {
    if (!url || !/^https:\/\//i.test(url)) {
      setDocumentError('This document does not have a valid download link.');
      return;
    }
    setDocumentError('');
    try {
      await Linking.openURL(url);
    } catch {
      setDocumentError(
        'This document could not be opened. Reopen the profile to refresh its secure link.',
      );
    }
  }
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
            <ContentPreview accessibilityRole="header" title="Profile name" text={profile.title} style={[styles.name, compact && styles.smallName]} lines={3} />
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
          <RecordSection
            title={teacher ? 'Certificates' : 'School achievements'}
            subtitle={
              teacher
                ? 'Documents shared by this teacher'
                : 'Documents shared by this school'
            }
            action={<FileText size={22} color={colors.brandDark} />}
          >
            {profile.documents?.length ? (
              profile.documents.map(document => (
                <View key={document.id} style={styles.document}>
                  <View style={styles.documentCopy}>
                    <Text style={styles.label}>{document.title}</Text>
                    {document.description ? (
                      <ContentPreview
                        text={document.description}
                        title={document.title}
                        style={styles.body}
                      />
                    ) : null}
                    <Text style={styles.documentMeta}>
                      {document.issueDate
                        ? `Issued ${document.issueDate.slice(0, 10)}`
                        : 'Issue date not provided'}
                    </Text>
                  </View>
                  <Button
                    title="Open document"
                    variant="link"
                    compact
                    onPress={() => openDocument(document.fileUrl)}
                  />
                </View>
              ))
            ) : (
              <Text style={styles.body}>
                {teacher
                  ? 'No public certificates have been added yet.'
                  : 'No public achievements have been added yet.'}
              </Text>
            )}
            {documentError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {documentError}
              </Text>
            ) : null}
          </RecordSection>
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
          {!teacher ? (
            <RecordSection
              title="Active roles"
              subtitle="Current opportunities published by this school"
            >
              <InstitutionJobsSection
                key={profile.id}
                institutionId={profile.id}
              />
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
const useStyles = createThemedStyles((colors, _common, layout) => ({
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
  identity: { flexDirection: layout.compact ? 'column' : 'row', gap: 16, alignItems: layout.compact ? 'flex-start' : 'center' },
  identityCopy: { flex: layout.compact ? 0 : 1, minWidth: 0, maxWidth: '100%', gap: 6 },
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
  locationText: { flexShrink: 1, color: colors.muted, fontSize: 12, lineHeight: 18 },
  verification: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  facts: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 18 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 24 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  tagSection: { gap: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  tag: {
    maxWidth: '100%',
    backgroundColor: colors.brandTint,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tagText: { color: colors.brandDark, fontSize: 12 },
  document: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 14,
  },
  documentCopy: { flexGrow: 1, flexShrink: 1, flexBasis: layout.stack ? '100%' : 180, minWidth: 0, gap: 5 },
  documentMeta: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  error: { color: '#b42318', fontSize: 14, lineHeight: 22 },
}));
