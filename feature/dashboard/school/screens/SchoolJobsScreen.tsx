import React from 'react';
import JobPostingFlow from '../../../../components/dashboard/JobPostingFlow';
import PostedJobsPanel from '../../../../components/dashboard/PostedJobsPanel';
import { useSchoolJobs } from '../hooks/useSchoolJobs';

export default function SchoolJobsScreen() {
  const jobs = useSchoolJobs();

  if (jobs.postingStep) {
    return (
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
    );
  }

  return (
    <PostedJobsPanel
      jobs={jobs.jobs}
      selectedId={jobs.selectedJobId}
      search={jobs.search}
      status={jobs.statusFilter}
      onSearch={jobs.setSearch}
      onStatus={jobs.setStatusFilter}
      onPost={jobs.startPosting}
      onSelect={jobs.openApplications}
    />
  );
}
