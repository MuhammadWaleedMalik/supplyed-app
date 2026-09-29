import React from 'react';
import { Text } from 'react-native';
import LimitedProfileCard from '../../../../components/dashboard/LimitedProfileCard';
import TeacherApplicationsPanel from '../../../../components/dashboard/TeacherApplicationsPanel';
import { jobStyles } from '../../../../components/dashboard/jobStyles';
import { useLimitedProfile } from '../../shared/hooks/useLimitedProfile';
import { useTeacherApplications } from '../hooks/useTeacherApplications';

export default function TeacherApplicationsScreen() {
  const applications = useTeacherApplications();
  const profile = useLimitedProfile();

  return (
    <>
      <LimitedProfileCard
        profile={profile.profile}
        error={profile.error}
        loading={profile.loading}
        onClose={profile.closeProfile}
      />

      <TeacherApplicationsPanel
        applications={applications.applications}
        search={applications.search}
        status={applications.status}
        onSearch={applications.setSearch}
        onStatus={applications.setStatus}
        onPoster={profile.openPoster}
      />

      {applications.loading ? (
        <Text style={jobStyles.modeBody}>Loading applications...</Text>
      ) : null}
      {applications.error ? (
        <Text style={jobStyles.error}>{applications.error}</Text>
      ) : null}
    </>
  );
}
