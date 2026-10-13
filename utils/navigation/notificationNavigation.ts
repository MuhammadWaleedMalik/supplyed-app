import type { SupplyEdNotification } from '../../feature/dashboard/shared/apis/notificationsApi';

type NotificationDestination =
  | { screen: 'Jobs'; jobId: string }
  | { screen: 'Applications'; applicationId?: string; jobId?: string }
  | { screen: 'Messages'; applicationId: string }
  | {
      screen:
        | 'Bookings'
        | 'Billing'
        | 'Dashboard'
        | 'Settings'
        | 'Notifications';
    }
  | { screen: 'TeacherProfile' | 'InstitutionProfile'; id: string };

function validId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
}

export function getNotificationDestination(
  item: SupplyEdNotification,
): NotificationDestination {
  const fallback: NotificationDestination = { screen: 'Notifications' };
  const link = item.link;
  if (!link || !link.startsWith('/') || link.startsWith('//')) return fallback;

  try {
    const decoded = decodeURIComponent(link);
    if (decoded.startsWith('//') || /[\\\s]/.test(decoded)) return fallback;

    const url = new URL(link, 'https://native.invalid');
    const path = link.split('?')[0].split('#')[0];
    const id = (key: string) => url.searchParams.get(key) ?? item.data?.[key];

    if (path === '/job-detail') {
      const jobId = id('jobId');
      return validId(jobId) ? { screen: 'Jobs', jobId } : fallback;
    }
    if (path === '/applications') {
      const applicationId = id('applicationId') ?? undefined;
      const jobId = id('jobId') ?? undefined;
      if (applicationId != null && !validId(applicationId)) return fallback;
      if (jobId != null && !validId(jobId)) return fallback;
      return { screen: 'Applications', applicationId, jobId };
    }
    if (path === '/messaging') {
      const applicationId = id('applicationId');
      return validId(applicationId)
        ? { screen: 'Messages', applicationId }
        : fallback;
    }
    if (path === '/teacher-profile' || path === '/institution-profile') {
      const profileId = url.searchParams.get(
        path === '/teacher-profile' ? 'teacherId' : 'institutionId',
      );
      if (!validId(profileId)) return fallback;
      return {
        screen:
          path === '/teacher-profile' ? 'TeacherProfile' : 'InstitutionProfile',
        id: profileId,
      };
    }
    if (path === '/bookings') return { screen: 'Bookings' };
    if (path === '/billing') return { screen: 'Billing' };
    if (path === '/dashboard') return { screen: 'Dashboard' };
    if (path === '/settings') return { screen: 'Settings' };
    return fallback;
  } catch {
    return fallback;
  }
}
