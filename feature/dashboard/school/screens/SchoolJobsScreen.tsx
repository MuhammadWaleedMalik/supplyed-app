import { useTheme } from '../../../../components/Ui/theme';
import React, { useRef } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
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

  if (jobs.postingStep) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
        <JobPostingFlow
          step={jobs.postingStep}
          form={jobs.form}
          error={jobs.error}
          loading={jobs.saving}
          onMode={jobs.chooseMode}
          onChange={jobs.change}
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
              <View style={styles.detailHeader}>
                <Button
                  title="Back to jobs"
                  variant="link"
                  icon={<ArrowLeft size={20} color={colors.brandDark} />}
                  onPress={jobs.closeJob}
                />
              </View>
              <ScrollView
                contentContainerStyle={styles.page}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.card}>
                  <Text style={styles.title}>{jobs.selectedJob.title}</Text>
                  <Text style={styles.cardBody}>
                    {jobs.selectedJob.status || 'DRAFT'} ·{' '}
                    {jobs.selectedJob.subject || 'Teaching role'}
                  </Text>
                  <Text style={styles.cardBody}>
                    {jobs.selectedJob.description || 'No description provided.'}
                  </Text>
                  <Text style={styles.cardTitle}>Location</Text>
                  <Text style={styles.cardBody}>
                    {[
                      jobs.selectedJob.address,
                      jobs.selectedJob.city,
                      jobs.selectedJob.county,
                      jobs.selectedJob.postalCode,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'Location pending'}
                  </Text>
                  <Text style={styles.cardTitle}>Dates and pay</Text>
                  <Text style={styles.cardBody}>
                    {jobs.selectedJob.startDate?.slice(0, 10) ||
                      'Flexible start'}
                    {jobs.selectedJob.endDate
                      ? ' to ' + jobs.selectedJob.endDate.slice(0, 10)
                      : ''}
                  </Text>
                  <Text style={styles.cardBody}>
                    {jobs.selectedJob.payAmount != null
                      ? 'GBP ' +
                        jobs.selectedJob.payAmount.toFixed(2) +
                        ' / ' +
                        (jobs.selectedJob.payType || 'booking')
                      : 'Pay not specified'}
                  </Text>
                  {jobs.selectedJob.keyStages?.length ? (
                    <Text style={styles.cardBody}>
                      Key stages: {jobs.selectedJob.keyStages.join(', ')}
                    </Text>
                  ) : null}
                  {jobs.selectedJob.requiredSkills?.length ? (
                    <Text style={styles.cardBody}>
                      Skills: {jobs.selectedJob.requiredSkills.join(', ')}
                    </Text>
                  ) : null}
                  {jobs.selectedJob.minExperienceYears != null ? (
                    <Text style={styles.cardBody}>
                      Experience: {jobs.selectedJob.minExperienceYears} years
                    </Text>
                  ) : null}
                  {jobs.selectedJob.parkingInfo ? (
                    <Text style={styles.cardBody}>
                      Parking: {jobs.selectedJob.parkingInfo}
                    </Text>
                  ) : null}
                </View>
                <SchoolApplicationsScreen
                  key={jobs.selectedJob.id}
                  jobId={jobs.selectedJob.id}
                />
              </ScrollView>
            </SafeAreaView>
          </SafeAreaProvider>
        </Modal>
      ) : null}
    </ScrollView>
  );
}
