import React, { useEffect } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DashboardNav from '../../../../components/dashboard/DashboardNav';
import NavigationContext from '../../../../components/dashboard/NavigationContext';
import DashboardTopBar from '../../../../components/dashboard/DashboardTopBar';
import { useStyles } from '../../../../components/dashboard/dashboardStyles';
import type { DashboardPage } from '../store/navigationSlice';
import { goBackToSource } from '../store/navigationSlice';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';

type Props = {
  role: 'teacher' | 'school';
  email: string;
  page: DashboardPage;
  onPage: (page: DashboardPage) => void;
  onLogout: () => void;
  onProfile: () => void;
  onHistory?: () => void;
  onSecurity: () => void;
  onSettings: () => void;
  children: React.ReactNode;
};

export default function DashboardLayout(props: Props) {
  const styles = useStyles();

  const dispatch = useAppDispatch();
  const returnPage = useAppSelector(
    state => state.dashboardNavigation.returnPage,
  );
  const { page, onPage } = props;
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (returnPage) dispatch(goBackToSource());
      else if (page !== 'Dashboard') onPage('Dashboard');
      else return false;
      return true;
    });
    return () => listener.remove();
  }, [dispatch, returnPage, page, onPage]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {props.page !== 'Messages' ? (
        <DashboardTopBar
          email={props.email}
          role={props.role}
          onApplications={() => props.onPage('Applications')}
          onInvitations={() => props.onPage('Invitations')}
          onProfile={props.onProfile}
          onBilling={() => props.onPage('Billing')}
          onNotifications={() => props.onPage('Notifications')}
          onHistory={props.onHistory}
          onSecurity={props.onSecurity}
          onSettings={props.onSettings}
          onLogout={props.onLogout}
        />
      ) : null}

      <NavigationContext />
      {props.page === 'Messages' ||
      props.page === 'Dashboard' ||
      props.page === 'Teachers' ||
      props.page === 'Invitations' ||
      props.page === 'Applications' ||
      props.page === 'Billing' ||
      props.page === 'Notifications' ||
      props.page === 'Jobs' ||
      props.page === 'Bookings' ||
      props.page === 'History' ? (
        props.children
      ) : (
        <KeyboardAvoidingView
          style={styles.scroll}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.page}
            keyboardShouldPersistTaps="handled"
          >
            {props.children}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <DashboardNav
        role={props.role}
        selected={props.page}
        onSelect={props.onPage}
      />
    </SafeAreaView>
  );
}
