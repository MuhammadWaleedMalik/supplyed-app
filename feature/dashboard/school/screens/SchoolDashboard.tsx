import React from 'react';
import InvitationsScreen from '../../shared/screens/InvitationsScreen';
import TeachersScreen from './TeachersScreen';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import DashboardLayout from '../../shared/components/DashboardLayout';
import BookingsScreen from '../../shared/screens/BookingsScreen';
import BillingScreen from '../../shared/screens/BillingScreen';
import MessagesScreen from '../../shared/screens/MessagesScreen';
import { DashboardPage, showPage } from '../../shared/store/navigationSlice';
import SchoolApplicationsScreen from './SchoolApplicationsScreen';
import { clearSchoolJobSelection } from '../store/schoolSlice';
import SchoolJobsScreen from './SchoolJobsScreen';
import SchoolDashboardScreen from './SchoolDashboardScreen';
import SchoolJobHistoryScreen from './SchoolJobHistoryScreen';
import NotificationsScreen from '../../shared/screens/NotificationsScreen';

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
  const applicationJobId = useAppSelector(
    state => state.dashboardNavigation.notificationApplicationJobId,
  );


  function changePage(nextPage: DashboardPage) {
    dispatch(clearSchoolJobSelection());
    dispatch(showPage(nextPage));
  }

  function pageContent() {
    if (page === 'Invitations') return <InvitationsScreen role="school" />;
    if (page === 'Teachers') return <TeachersScreen />;
    if (page === 'Notifications') {
      return (
        <NotificationsScreen type="school" onSettings={props.onSettings} />
      );
    }
    if (page === 'Jobs') {
      return <SchoolJobsScreen />;
    }
    if (page === 'Applications') {
      return <SchoolApplicationsScreen jobId={applicationJobId} />;
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
    if (page === 'History') {
      return <SchoolJobHistoryScreen />;
    }
    return <SchoolDashboardScreen />;
  }

  return (
    <DashboardLayout
      role="school"
      email={props.email}
      page={page}
      onPage={changePage}
      onLogout={props.onExit}
      onProfile={props.onProfile}
      onHistory={() => changePage('History')}
      onSecurity={props.onSecurity}
      onSettings={props.onSettings}
    >
      {pageContent()}
    </DashboardLayout>
  );
}
