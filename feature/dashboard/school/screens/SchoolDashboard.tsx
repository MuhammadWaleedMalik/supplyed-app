import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import DashboardLayout from '../../shared/components/DashboardLayout';
import BookingsScreen from '../../shared/screens/BookingsScreen';
import BillingScreen from '../../shared/screens/BillingScreen';
import MessagesScreen from '../../shared/screens/MessagesScreen';
import {
  DashboardPage,
  resetDashboardNavigation,
  showPage,
} from '../../shared/store/navigationSlice';
import { useLoadSchoolDashboard } from '../hooks/useLoadSchoolDashboard';
import SchoolApplicationsScreen from './SchoolApplicationsScreen';
import SchoolInterviewsScreen from './SchoolInterviewsScreen';
import SchoolJobsScreen from './SchoolJobsScreen';
import SchoolDashboardScreen from './SchoolDashboardScreen';

type Props = {
  email: string;
  onExit: () => void;
  onProfile: () => void;
  onSecurity: () => void;
  onSettings: () => void;
};

export default function SchoolDashboard(props: Props) {
  const dispatch = useAppDispatch();
  const page = useAppSelector(state => state.dashboardNavigation.page);

  useLoadSchoolDashboard();

  useEffect(() => {
    dispatch(resetDashboardNavigation());
  }, [dispatch]);

  function changePage(nextPage: DashboardPage) {
    dispatch(showPage(nextPage));
  }

  function pageContent() {
    if (page === 'Jobs') {
      return <SchoolJobsScreen />;
    }
    if (page === 'Applications') {
      return <SchoolApplicationsScreen />;
    }
    if (page === 'Bookings') {
      return <BookingsScreen type="school" />;
    }
    if (page === 'Billing') {
      return <BillingScreen role="INSTITUTION" />;
    }
    if (page === 'Messages') {
      return <MessagesScreen role="school" />;
    }
    if (page === 'Interviews') {
      return <SchoolInterviewsScreen />;
    }
    return <SchoolDashboardScreen />;
  }

  return (
    <DashboardLayout
      email={props.email}
      page={page}
      onPage={changePage}
      onLogout={props.onExit}
      onProfile={props.onProfile}
      onSecurity={props.onSecurity}
      onSettings={props.onSettings}
    >
      {pageContent()}
    </DashboardLayout>
  );
}
