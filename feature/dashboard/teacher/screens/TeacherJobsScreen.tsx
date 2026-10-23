import { useTheme } from '../../../../components/Ui/theme';
import React, { useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import DetailHeader from '../../../../components/Ui/DetailHeader';
import { useSessionState } from '../../../../utils/ui/useSessionState';
import SearchField from '../../../../components/Ui/SearchField';
import RecommendedJobs from '../../../../components/dashboard/RecommendedJobs';
import ChoiceField from '../../../../components/dashboard/ChoiceField';
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
  const [view, setView] = useSessionState('teacher.jobs.view', 'All jobs');
  const dispatch = useAppDispatch();
  const scrollStarted = useRef(false);

  const appliedJobIds = jobs.applications.map(application => application.jobId);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        view === 'All jobs' ? (
          <RefreshControl
            refreshing={jobs.jobsLoading && jobs.jobs.length > 0}
            onRefresh={jobs.retryJobs}
            tintColor={colors.brand}
          />
        ) : undefined
      }
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
          if (view === 'All jobs') jobs.loadMoreJobs();
        }
      }}
    >
      <View style={styles.section}>
        <Text style={styles.title}>
          {jobs.notificationJobId ? 'Job details' : 'Find your next role'}
        </Text>

        {!jobs.notificationJobId ? (
          <ChoiceField
            label="Browse jobs"
            hideLabel
            value={view}
            options={['For you', 'All jobs']}
            onChange={setView}
          />
        ) : null}
        {view === 'For you' && !jobs.notificationJobId ? (
          <RecommendedJobs
            appliedJobIds={appliedJobIds}
            onApply={jobs.startApplication}
          />
        ) : (
          <>
            {jobs.notificationJobId ? (
              <Button
                title="Show all jobs"
                variant="link"
                onPress={() => dispatch(showPage('Jobs'))}
              />
            ) : (
              <>
                <SearchField
                  placeholder="Job title or keyword"
                  value={jobs.search}
                  onChangeText={jobs.setSearch}
                />
                <FindJobFilters
                  roleType={jobs.roleType}
                  keyStage={jobs.keyStage}
                  subject={jobs.subject}
                  onRoleType={jobs.setRoleType}
                  onKeyStage={jobs.setKeyStage}
                  onSubject={jobs.setSubject}
                />
              </>
            )}

            {jobs.error ? (
              <>
                <Text accessibilityLiveRegion="polite" style={styles.cardBody}>
                  {jobs.error}
                </Text>
                <Button
                  title="Retry jobs"
                  variant="social"
                  onPress={jobs.retryJobs}
                />
              </>
            ) : null}

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
          </>
        )}
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
                <DetailHeader title="Apply for this role" subtitle="Introduce yourself to the school" onBack={jobs.closeApplication} disabled={jobs.submitting} backLabel="Return to jobs" />
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
