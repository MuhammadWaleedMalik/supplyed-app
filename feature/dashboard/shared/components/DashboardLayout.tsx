import React from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DashboardNav from '../../../../components/dashboard/DashboardNav';
import DashboardTopBar from '../../../../components/dashboard/DashboardTopBar';
import { styles } from '../../../../components/dashboard/dashboardStyles';
import type { DashboardPage } from '../store/navigationSlice';

type Props = {
  email: string;
  page: DashboardPage;
  onPage: (page: DashboardPage) => void;
  onLogout: () => void;
  onProfile: () => void;
  onSecurity: () => void;
  onSettings: () => void;
  children: React.ReactNode;
};

export default function DashboardLayout(props: Props) {
  const { width, fontScale } = useWindowDimensions();
  const showEmail = width / fontScale > 390;

  return (
    <SafeAreaView style={styles.safeArea}>
      <DashboardTopBar
        email={props.email}
        showEmail={showEmail}
        onProfile={props.onProfile}
        onSecurity={props.onSecurity}
        onSettings={props.onSettings}
        onLogout={props.onLogout}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        {props.children}
      </ScrollView>

      <DashboardNav selected={props.page} onSelect={props.onPage} />
    </SafeAreaView>
  );
}
