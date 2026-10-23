import type { AppIconName } from '../components/Ui/AppIcon';
import type { DashboardPage } from '../feature/dashboard/shared/store/navigationSlice';

export type DashboardTabItem = {
  page: DashboardPage;
  label: string;
  icon: AppIconName;
};

export function dashboardTabs(role: 'teacher' | 'school'): DashboardTabItem[] {
  return [
    { page: 'Dashboard', label: 'Home', icon: 'dashboard' },
    { page: 'Jobs', label: 'Jobs', icon: 'jobs' },
    role === 'school'
      ? { page: 'Teachers', label: 'Teachers', icon: 'teachers' }
      : { page: 'Applications', label: 'Applications', icon: 'applications' },
    { page: 'Bookings', label: 'Bookings', icon: 'bookings' },
    { page: 'Messages', label: 'Inbox', icon: 'messages' },
  ];
}
