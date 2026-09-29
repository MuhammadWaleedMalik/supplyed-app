import React from 'react';
import { Text, View } from 'react-native';
import ApplicationWizard from '../../../../components/dashboard/ApplicationWizard';
import FindJobFilters from '../../../../components/dashboard/FindJobFilters';
import LimitedProfileCard from '../../../../components/dashboard/LimitedProfileCard';
import TeacherJobList from '../../../../components/dashboard/TeacherJobList';
import { styles } from '../../../../components/dashboard/dashboardStyles';
import { useLimitedProfile } from '../../shared/hooks/useLimitedProfile';
import { useTeacherJobs } from '../hooks/useTeacherJobs';

export default function TeacherJobsScreen() {
  const jobs = useTeacherJobs();
  const profile = useLimitedProfile();

  if (jobs.selectedJob) {
    return (
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
    );
  }

  const appliedJobIds = jobs.applications.map(application => application.jobId);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Find your next role</Text>
      <Text style={styles.subtitle}>All jobs currently posted by schools.</Text>

      <FindJobFilters
        roleType={jobs.roleType}
        keyStage={jobs.keyStage}
        subject={jobs.subject}
        onRoleType={jobs.setRoleType}
        onKeyStage={jobs.setKeyStage}
        onSubject={jobs.setSubject}
      />

      {jobs.error ? <Text style={styles.cardBody}>{jobs.error}</Text> : null}

      <LimitedProfileCard
        profile={profile.profile}
        error={profile.error}
        loading={profile.loading}
        onClose={profile.closeProfile}
      />

      <TeacherJobList
        jobs={jobs.jobs}
        appliedJobIds={appliedJobIds}
        onApply={jobs.startApplication}
        onPoster={profile.openPoster}
      />
    </View>
  );
}
