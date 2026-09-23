import React from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Ui/Button';
import Input from '../../../components/Ui/Input';
import Select from '../../../components/Ui/Select';
import DashboardNav from '../../../components/dashboard/DashboardNav';
import DashboardTopBar from '../../../components/dashboard/DashboardTopBar';
import { styles } from '../../../components/dashboard/dashboardStyles';
import { useDashboard } from '../hooks/useDashboard';
import { useHirerJobs } from '../hooks/useHirerJobs';

type Props = {
  email: string;
  onExit: () => void;
  onProfile: () => void;
  onSecurity: () => void;
  onSettings: () => void;
};

export default function HirerDashboardScreen({
  email, onExit, onProfile, onSecurity, onSettings,
}: Props) {
  const dashboard = useDashboard();
  const jobs = useHirerJobs();
  const { width, fontScale } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.safeArea}>
      <DashboardTopBar email={email} showEmail={width / fontScale > 390}
        onProfile={onProfile} onSecurity={onSecurity}
        onSettings={onSettings} onLogout={onExit} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
        {dashboard.tab === 'Dashboard' ? (
          <View style={styles.section}>
            <Text style={styles.title}>Hiring workspace</Text>
            <Text style={styles.subtitle}>{jobs.jobs.length} posted roles</Text>
          </View>
        ) : null}
        {dashboard.tab === 'Jobs' ? (
          <View style={styles.section}>
            <Text style={styles.title}>Post job</Text>
            <View style={styles.card}>
              <Input label="TITLE" value={jobs.form.title}
                onChangeText={value => jobs.change('title', value)} />
              <Input label="DESCRIPTION" multiline value={jobs.form.description}
                onChangeText={value => jobs.change('description', value)} />
              <Input label="SUBJECT" value={jobs.form.subject}
                onChangeText={value => jobs.change('subject', value)} />
              <Input label="CITY" value={jobs.form.city}
                onChangeText={value => jobs.change('city', value)} />
              <Input label="PAY AMOUNT" number value={jobs.form.payAmount}
                onChangeText={value => jobs.change('payAmount', value)} />
              <Select label="STATUS" value={jobs.form.status} placeholder="Status"
                options={['DRAFT', 'ACTIVE']} onChange={value => jobs.change('status', value)} />
              {jobs.error ? <Text style={styles.cardBody}>{jobs.error}</Text> : null}
              <Button title={jobs.loading ? 'Saving...' : 'Save job'} onPress={jobs.saveJob} />
            </View>
          </View>
        ) : null}
        {dashboard.tab === 'Applications' ? <Text style={styles.title}>Applications</Text> : null}
        {dashboard.tab === 'Interviews' ? <Text style={styles.title}>Interviews</Text> : null}
        {dashboard.tab === 'Teachers' ? <Text style={styles.title}>Teachers</Text> : null}
        <View style={styles.section}>
          <Text style={styles.eyebrow}>YOUR JOBS</Text>
          {jobs.jobs.map(job => (
            <View key={job.id} style={styles.card}>
              <Text style={styles.cardTitle}>{job.title}</Text>
              <Text style={styles.cardBody}>{job.city || 'City not set'}</Text>
              <Text style={styles.metricDetail}>{job.status || 'DRAFT'}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <DashboardNav selected={dashboard.tab} onSelect={dashboard.setTab} />
    </SafeAreaView>
  );
}


