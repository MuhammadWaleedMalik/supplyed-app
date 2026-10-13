import { useTheme } from '../../../../components/Ui/theme';
import React, { useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import Button from '../../../../components/Ui/Button';
import ApplicationWizard from '../../../../components/dashboard/ApplicationWizard';
import FindJobFilters from '../../../../components/dashboard/FindJobFilters';
import TeacherJobList from '../../../../components/dashboard/TeacherJobList';
import { useStyles } from '../../../../components/dashboard/dashboardStyles';
import { useTeacherJobs } from '../hooks/useTeacherJobs';
import { useAppDispatch } from '../../../../store/hooks';
import { showPage } from '../../shared/store/navigationSlice';

export default function TeacherJobsScreen() {
  const { colors } = useTheme();
  const styles = useStyles();

  const jobs = useTeacherJobs();
  const dispatch = useAppDispatch();
  const scrollStarted = useRef(false);

  const appliedJobIds = jobs.applications.map(application => application.jobId);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={100}
      onScrollBeginDrag={() => {
        scrollStarted.current = true;
      }}
      onScroll={event => {
        const { contentOffset, contentSize, layoutMeasurement } =
          event.nativeEvent;
        if (
          layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 240 &&
          scrollStarted.current
        ) {
          scrollStarted.current = false;
          jobs.loadMoreJobs();
        }
      }}
    >
      <View style={styles.section}>
        <Text style={styles.title}>
          {jobs.notificationJobId ? 'Job details' : 'Find your next role'}
        </Text>
        <Text style={styles.subtitle}>Jobs currently posted by schools.</Text>

        {jobs.notificationJobId ? (
          <Button
            title="Show all jobs"
            variant="link"
            onPress={() => dispatch(showPage('Jobs'))}
          />
        ) : (
          <FindJobFilters
            roleType={jobs.roleType}
            keyStage={jobs.keyStage}
            subject={jobs.subject}
            onRoleType={jobs.setRoleType}
            onKeyStage={jobs.setKeyStage}
            onSubject={jobs.setSubject}
          />
        )}

        {jobs.error ? <Text style={styles.cardBody}>{jobs.error}</Text> : null}

        {jobs.jobsLoading && !jobs.jobs.length ? (
          <ActivityIndicator color={colors.brandDark} />
        ) : (
          <TeacherJobList
            jobs={jobs.jobs}
            appliedJobIds={appliedJobIds}
            onApply={jobs.startApplication}
          />
        )}
        {jobs.jobsLoadingMore ? (
          <ActivityIndicator color={colors.brandDark} />
        ) : null}
      </View>
      {jobs.selectedJob ? (
        <Modal
          visible
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={jobs.closeApplication}
        >
          <SafeAreaProvider>
            <KeyboardAvoidingView
              style={styles.safeArea}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <SafeAreaView style={styles.safeArea}>
                <View style={styles.detailHeader}>
                  <Button
                    title="Back to jobs"
                    variant="link"
                    icon={<ArrowLeft size={20} color={colors.brandDark} />}
                    onPress={jobs.closeApplication}
                    disabled={jobs.submitting}
                  />
                </View>
                <ScrollView
                  key={jobs.applyStep}
                  contentContainerStyle={styles.page}
                  keyboardShouldPersistTaps="handled"
                >
                  <ApplicationWizard
                    job={jobs.selectedJob}
                    step={jobs.applyStep}
                    coverLetter={jobs.coverLetter}
                    error={jobs.error}
                    loading={jobs.submitting}
                    onCoverLetter={jobs.setCoverLetter}
                    onStep={jobs.setApplyStep}
                    onReview={jobs.reviewApplication}
                    onClose={jobs.closeApplication}
                    onSubmit={jobs.submitApplication}
                  />
                </ScrollView>
              </SafeAreaView>
            </KeyboardAvoidingView>
          </SafeAreaProvider>
        </Modal>
      ) : null}
    </ScrollView>
  );
}
