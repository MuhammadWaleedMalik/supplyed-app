import { useTheme } from '../../../../components/Ui/theme';
import JobRecordDetails from '../../../../components/dashboard/JobRecordDetails';
import DetailHeader from '../../../../components/Ui/DetailHeader';
import JobActions from '../../../../components/dashboard/JobActions';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../../components/Ui/Button';
import { useStyles } from '../../../../components/dashboard/dashboardStyles';
import JobPostingFlow from '../../../../components/dashboard/JobPostingFlow';
import PostedJobsPanel from '../../../../components/dashboard/PostedJobsPanel';
import { useSchoolJobs } from '../hooks/useSchoolJobs';
import SchoolApplicationsScreen from './SchoolApplicationsScreen';

export default function SchoolJobsScreen() {
  const { colors } = useTheme();
  const styles = useStyles();

  const jobs = useSchoolJobs();
  const scrollStarted = useRef(false);
  const formScroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    formScroll.current?.scrollTo({ y: 0, animated: false });
  }, [jobs.postingStep]);

  if (jobs.postingStep) {
    return (
      <ScrollView
        ref={formScroll}
        style={styles.scroll}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={styles.title}>
          {jobs.editingJob
            ? 'Edit job'
            : jobs.duplicating
            ? 'Duplicate as draft'
            : 'Post a job'}
        </Text>
        {jobs.duplicating ? (
          <Text style={styles.cardBody}>
            Dates have been cleared. Review the pay and role details before
            saving this new draft. Publish it later from Edit draft.
          </Text>
        ) : null}
        <JobPostingFlow
          draftOnly={jobs.duplicating}
          published={jobs.editingJob?.status === 'ACTIVE'}
          step={jobs.postingStep}
          form={jobs.form}
          error={jobs.error}
          loading={jobs.saving}
          onMode={jobs.chooseMode}
          onChange={jobs.change}
          onAddressMode={jobs.changeAddressMode}
          schoolAddress={jobs.schoolAddress}
          onNext={jobs.continueToRequirements}
          onBack={jobs.previousStep}
          onClose={jobs.cancelPosting}
          onSave={jobs.saveJob}
        />
      </ScrollView>
    );
  }

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
      <PostedJobsPanel
        jobs={jobs.jobs}
        search={jobs.search}
        status={jobs.statusFilter}
        onSearch={jobs.setSearch}
        onStatus={jobs.setStatusFilter}
        onPost={jobs.startPosting}
        onSelect={jobs.openApplications}
      />
      {jobs.jobsLoading && !jobs.jobs.length ? (
        <ActivityIndicator color={colors.brandDark} />
      ) : null}
      {jobs.jobsLoadingMore ? (
        <ActivityIndicator color={colors.brandDark} />
      ) : null}
      {jobs.error ? (
        <Text style={styles.cardBody} accessibilityLiveRegion="polite">
          {jobs.error}
        </Text>
      ) : null}
      {jobs.selectedJob ? (
        <Modal
          visible
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={jobs.closeJob}
        >
          <SafeAreaProvider>
            <SafeAreaView style={styles.safeArea}>
              <DetailHeader title="Job details" subtitle="Placement and candidates" onBack={jobs.closeJob} backLabel="Return to jobs" />
              <SchoolApplicationsScreen key={jobs.selectedJob.id} jobId={jobs.selectedJob.id} header={<JobRecordDetails job={jobs.selectedJob} actions={<>
                {['DRAFT', 'ACTIVE'].includes(jobs.selectedJob.status || '') ? <Button title={jobs.selectedJob.status === 'ACTIVE' ? 'Edit job' : 'Edit draft'} variant="outline" disabled={jobs.openingEditor} onPress={() => jobs.selectedJob && jobs.openEditor(jobs.selectedJob)} /> : null}
                <Button title="Duplicate as draft" variant="outline" disabled={jobs.openingEditor} onPress={() => jobs.selectedJob && jobs.openEditor(jobs.selectedJob, true)} />
                <JobActions job={jobs.selectedJob} onChanged={jobs.refreshJobs} />
                {jobs.error ? <Text accessibilityRole="alert" style={styles.cardBody}>{jobs.error}</Text> : null}
              </>} />} />
            </SafeAreaView>
          </SafeAreaProvider>
        </Modal>
      ) : null}
    </ScrollView>
  );
}
