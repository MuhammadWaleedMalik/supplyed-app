import { useState } from 'react';
import { DashboardTab } from '../../../constants/dashboardData';

export function useDashboard() {
  const [tab, setTab] = useState<DashboardTab>('Dashboard');
  const [roleFilter, setRoleFilter] = useState('All');

  return { tab, setTab, roleFilter, setRoleFilter };
}
