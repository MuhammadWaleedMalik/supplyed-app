import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import DashboardLayout from '../../shared/components/DashboardLayout';
import BookingsScreen from '../../shared/screens/BookingsScreen';
import MessagesScreen from '../../shared/screens/MessagesScreen';
import {
  DashboardPage,
  resetDashboardNavigation,
  showPage,
} from '../../shared/store/navigationSlice';
import { useLoadTeacherDashboard } from '../hooks/useLoadTeacherDashboard';
import TeacherApplicationsScreen from './TeacherApplicationsScreen';
import TeacherInterviewsScreen from './TeacherInterviewsScreen';
import TeacherJobsScreen from './TeacherJobsScreen';
import TeacherDashboardScreen from './TeacherDashboardScreen';

type Props = {
  email: string;
  onExit: () => void;
  onProfile: () => void;
  onSecurity: () => void;
  onSettings: () => void;
};

export default function TeacherDashboard(props: Props) {
  const dispatch = useAppDispatch();
  const page = useAppSelector(state => state.dashboardNavigation.page);

  useLoadTeacherDashboard();

  useEffect(() => {
    dispatch(resetDashboardNavigation());
  }, [dispatch]);

  function changePage(nextPage: DashboardPage) {
    dispatch(showPage(nextPage));
  }

  function pageContent() {
    if (page === 'Jobs') {
      return <TeacherJobsScreen />;
    }
    if (page === 'Applications') {
      return <TeacherApplicationsScreen />;
    }
    if (page === 'Bookings') {
      return <BookingsScreen type="teacher" />;
    }
    if (page === 'Messages') {
      return <MessagesScreen role="teacher" />;
    }
    if (page === 'Interviews') {
      return <TeacherInterviewsScreen />;
    }
    return <TeacherDashboardScreen />;
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
