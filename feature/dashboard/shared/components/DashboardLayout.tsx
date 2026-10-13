import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DashboardNav from '../../../../components/dashboard/DashboardNav';
import DashboardTopBar from '../../../../components/dashboard/DashboardTopBar';
import { useStyles } from '../../../../components/dashboard/dashboardStyles';
import type { DashboardPage } from '../store/navigationSlice';

type Props = {
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

  const { width, fontScale } = useWindowDimensions();
  const showEmail = width / fontScale > 390;

  return (
    <SafeAreaView style={styles.safeArea}>
      {props.page !== 'Messages' ? (
        <DashboardTopBar
          email={props.email}
          showEmail={showEmail}
          onProfile={props.onProfile}
          onBilling={() => props.onPage('Billing')}
          onNotifications={() => props.onPage('Notifications')}
          onHistory={props.onHistory}
          onSecurity={props.onSecurity}
          onSettings={props.onSettings}
          onLogout={props.onLogout}
        />
      ) : null}

      {props.page === 'Messages' ||
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

      <DashboardNav selected={props.page} onSelect={props.onPage} />
    </SafeAreaView>
  );
}
