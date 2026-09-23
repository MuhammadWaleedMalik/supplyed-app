import React from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Ui/Button';
import DashboardNav from '../../../components/dashboard/DashboardNav';
import DashboardTopBar from '../../../components/dashboard/DashboardTopBar';
import DashboardEmpty from '../../../components/dashboard/DashboardEmpty';
import { styles } from '../../../components/dashboard/dashboardStyles';
import { useDashboard } from '../hooks/useDashboard';
import { useTeacherJobs } from '../hooks/useTeacherJobs';

type Props = {
  email: string;
  onExit: () => void;
  onProfile: () => void;
  onSecurity: () => void;
  onSettings: () => void;
};

export default function TeacherDashboardScreen({
  email, onExit, onProfile, onSecurity, onSettings,
}: Props) {
  const dashboard = useDashboard();
  const jobs = useTeacherJobs();
  const { width, fontScale } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.safeArea}>
      <DashboardTopBar email={email} showEmail={width / fontScale > 390}
        onProfile={onProfile} onSecurity={onSecurity}
        onSettings={onSettings} onLogout={onExit} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
        {dashboard.tab === 'Dashboard' ? (
          <View style={styles.section}>
            <Text style={styles.title}>Teacher workspace</Text>
            <Text style={styles.subtitle}>{jobs.jobs.length} recommended jobs</Text>
          </View>
        ) : null}
        {dashboard.tab === 'Jobs' ? (
          <View style={styles.section}>
            <Text style={styles.title}>Find jobs</Text>
            {jobs.error ? <Text style={styles.cardBody}>{jobs.error}</Text> : null}
            {jobs.jobs.map(item => (
              <View key={item.job.id} style={styles.card}>
                <Text style={styles.cardTitle}>{item.job.title}</Text>
                <Text style={styles.cardBody}>{item.job.subject || 'Subject not set'}</Text>
                <Text style={styles.metricDetail}>{item.match?.score || 0}% match</Text>
                <Button title="Apply" onPress={() => undefined} compact />
              </View>
            ))}
          </View>
        ) : null}
        {dashboard.tab === 'Applications' ? (
          <DashboardEmpty title="Applications" description="No applications yet" />
        ) : null}
        {dashboard.tab === 'Interviews' ? (
          <DashboardEmpty title="Interviews" description="No interviews yet" />
        ) : null}
        {dashboard.tab === 'Teachers' ? (
          <DashboardEmpty title="Teachers" description="Your profile is ready" />
        ) : null}
      </ScrollView>
      <DashboardNav selected={dashboard.tab} onSelect={dashboard.setTab} />
    </SafeAreaView>
  );
}

