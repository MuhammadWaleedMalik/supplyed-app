import type { AppIconName } from '../components/Ui/AppIcon';

export type DashboardTab =
  | 'Jobs'
  | 'Applications'
  | 'Dashboard'
  | 'Interviews'
  | 'Teachers';

export const dashboardTabs: { label: DashboardTab; icon: AppIconName }[] = [
  { label: 'Jobs', icon: 'jobs' },
  { label: 'Applications', icon: 'applications' },
  { label: 'Dashboard', icon: 'dashboard' },
  { label: 'Interviews', icon: 'interview' },
  { label: 'Teachers', icon: 'teachers' },
];

export const dashboardStats = [
  { value: '0', label: 'ACTIVE JOBS', detail: '0 drafts' },
  { value: '0', label: 'TOTAL POSTED', detail: 'All statuses' },
  { value: '0', label: 'CLOSED ROLES', detail: 'History retained' },
  { value: '100%', label: 'SAFETY SETUP', detail: 'Account-led contact' },
];

export const roleFilters = ['All', 'Active', 'Draft', 'Expired', 'Closed'];

export const recommendedTeachers = [
  {
    initials: 'SJ', name: 'Sarah Johnson', subject: 'KS2 & KS3 Mathematics',
    location: 'Salford, Greater Manchester', available: 'Available today',
    match: '94%', color: '#e5f4f9',
  },
  {
    initials: 'MW', name: 'Marcus Webb', subject: 'KS3 & KS4 Science',
    location: 'Bolton', available: 'Available today',
    match: '91%', color: '#eaf7fc',
  },
  {
    initials: 'PM', name: 'Priya Mehta', subject: 'Primary - KS1 & KS2',
    location: 'Manchester', available: 'Available tomorrow',
    match: '88%', color: '#fff7e6',
  },
];

export const safetyPoints = [
  'Account-led messaging',
  'No learner account required',
  'Location shared after accepted request',
];
