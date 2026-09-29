import type { AppIconName } from '../components/Ui/AppIcon';
import type { DashboardPage } from '../feature/dashboard/shared/store/navigationSlice';

export type DashboardTabItem = {
  label: DashboardPage;
  icon: AppIconName;
};

export const dashboardTabs: DashboardTabItem[] = [
  { label: 'Dashboard', icon: 'dashboard' },
  { label: 'Jobs', icon: 'jobs' },
  { label: 'Applications', icon: 'applications' },
  { label: 'Bookings', icon: 'bookings' },
  { label: 'Messages', icon: 'messages' },
  { label: 'Interviews', icon: 'interview' },
];
