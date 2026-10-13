import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';

export type LimitedProfile = {
  id: string;
  title: string;
  subtitle: string;
  note?: string;
  imageUrl?: string;
  about?: string;
  location?: string;
  tags?: string[];
  details?: string[];
  verified?: boolean;
};

export type InstructorPublicProfile = {
  id: string;
  fullName: string;
  imageUrl: string | null;
  bio: string | null;
  city: string | null;
  county: string | null;
  subjects: string[];
  skills: string[];
  keyStages: string[];
  experience: number | null;
  hourlyRate: number | null;
  dailyRate: number | null;
  currency: string | null;
  ratingAverage: number;
  ratingCount: number;
  dbsVerified: boolean;
  memberSince: string | null;
};

export type InstitutionPublicProfile = {
  id: string;
  name: string;
  imageUrl: string | null;
  institutionType: 'SINGLE_SCHOOL' | 'MAT_SCHOOL';
  trust: { name: string } | null;
  address: string;
  city: string;
  county: string | null;
  postalCode: string | null;
  staffingNeeds: string | null;
  coverTypes: string[];
  typicalPupilCount: number | null;
  verified: boolean;
  memberSince: string | null;
};

function localDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
}

export async function getInstructorProfile(id: string): Promise<LimitedProfile> {
  const profile = await protectedRequest<InstructorPublicProfile>(
    endpoints.teacherProfile + '/profile/' + encodeURIComponent(id),
  );
  const tags = Array.from(new Set([
    ...(profile.subjects || []), ...(profile.keyStages || []), ...(profile.skills || []),
  ])).slice(0, 8);
  const currency = profile.currency || 'GBP';
  const rates = [
    profile.hourlyRate == null
      ? ''
      : `${currency} ${profile.hourlyRate.toFixed(2)} hourly`,
    profile.dailyRate == null
      ? ''
      : `${currency} ${profile.dailyRate.toFixed(2)} daily`,
  ].filter(Boolean);
  const memberSince = localDate(profile.memberSince);
  return {
    id: profile.id,
    title: profile.fullName,
    subtitle: profile.experience == null ? 'Teacher profile' : profile.experience + ' years experience',
    note: profile.dbsVerified ? 'DBS verified' : 'Teacher profile',
    imageUrl: profile.imageUrl || undefined,
    about: profile.bio || undefined,
    location: [profile.city, profile.county].filter(Boolean).join(', '),
    tags,
    details: [
      profile.ratingCount
        ? `${profile.ratingAverage.toFixed(1)} rating from ${profile.ratingCount} review${profile.ratingCount === 1 ? '' : 's'}`
        : 'No marketplace reviews yet',
      ...rates,
      memberSince ? `Member since ${memberSince}` : '',
    ].filter(Boolean),
    verified: Boolean(profile.dbsVerified),
  };
}

export async function getInstitutionProfile(
  id: string,
): Promise<LimitedProfile> {
  const profile = await protectedRequest<InstitutionPublicProfile>(
    endpoints.schoolProfile + '/profile/' + encodeURIComponent(id),
  );
  const memberSince = localDate(profile.memberSince);
  return {
    id: profile.id,
    title: profile.name,
    subtitle:
      profile.institutionType === 'MAT_SCHOOL'
        ? 'Multi-academy trust school'
        : 'School',
    note: profile.verified ? 'Verified school' : 'School profile',
    imageUrl: profile.imageUrl || undefined,
    about: profile.staffingNeeds || undefined,
    location: [
      profile.address,
      profile.city,
      profile.county,
      profile.postalCode,
    ]
      .filter(Boolean)
      .join(', '),
    tags: profile.coverTypes,
    details: [
      profile.trust?.name ? `Trust: ${profile.trust.name}` : '',
      profile.typicalPupilCount == null
        ? ''
        : `Typical pupil count: ${profile.typicalPupilCount}`,
      memberSince ? `Member since ${memberSince}` : '',
    ].filter(Boolean),
    verified: profile.verified,
  };
}

export async function getApplicationSchoolProfile(
  applicationId: string,
): Promise<LimitedProfile> {
  const conversation = await protectedRequest<{
    counterpart: {
      id: string | null;
      role: 'teacher' | 'school';
    };
  }>(endpoints.conversationForApplication(applicationId));
  if (
    conversation.counterpart.role !== 'school' ||
    !conversation.counterpart.id
  )
    throw new Error('This school profile is unavailable.');
  return getInstitutionProfile(conversation.counterpart.id);
}
