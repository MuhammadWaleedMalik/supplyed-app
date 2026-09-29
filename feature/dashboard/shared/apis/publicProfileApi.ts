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
  verified?: boolean;
};

type PublicUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
  emailVerified?: boolean;
};

type InstructorProfile = {
  id: string;
  fullName: string;
  imageUrl?: string | null;
  bio?: string | null;
  city?: string | null;
  county?: string | null;
  subjects?: string[];
  skills?: string[];
  keyStages?: string[];
  status?: string;
  dbsVerified?: boolean;
  experience?: number | null;
};

export async function getPosterProfile(userId: string): Promise<LimitedProfile> {
  const user = await protectedRequest<PublicUser>(endpoints.users + '/' + userId);
  return {
    id: user.id,
    title: user.name || user.email,
    subtitle: user.role || 'Job poster',
    note: user.emailVerified ? 'Verified institution account' : 'Email verification pending',
    about: 'This is the limited institution profile connected to the posted role.',
    verified: Boolean(user.emailVerified),
  };
}

export async function getInstructorProfile(id: string): Promise<LimitedProfile> {
  const profile = await protectedRequest<InstructorProfile>(endpoints.teacherProfile + '/profile/' + id);
  const tags = Array.from(new Set([
    ...(profile.subjects || []), ...(profile.keyStages || []), ...(profile.skills || []),
  ])).slice(0, 8);
  return {
    id: profile.id,
    title: profile.fullName,
    subtitle: profile.experience == null ? 'Teacher profile' : profile.experience + ' years experience',
    note: profile.dbsVerified ? 'DBS verified' : profile.status || 'Profile available',
    imageUrl: profile.imageUrl || undefined,
    about: profile.bio || undefined,
    location: [profile.city, profile.county].filter(Boolean).join(', '),
    tags,
    verified: Boolean(profile.dbsVerified),
  };
}
