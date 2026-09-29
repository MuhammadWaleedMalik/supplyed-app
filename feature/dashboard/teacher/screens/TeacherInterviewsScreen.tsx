import React from 'react';
import { Text, View } from 'react-native';
import LimitedProfileCard from '../../../../components/dashboard/LimitedProfileCard';
import MyApplicationsList from '../../../../components/dashboard/MyApplicationsList';
import { jobStyles } from '../../../../components/dashboard/jobStyles';
import { useAppSelector } from '../../../../store/hooks';
import { useLimitedProfile } from '../../shared/hooks/useLimitedProfile';

export default function TeacherInterviewsScreen() {
  const profile = useLimitedProfile();
  const applications = useAppSelector(state =>
    state.teacherDashboard.applications.filter(
      application => application.status === 'INTERVIEW',
    ),
  );

  return (
    <View style={jobStyles.shell}>
      <LimitedProfileCard
        profile={profile.profile}
        error={profile.error}
        loading={profile.loading}
        onClose={profile.closeProfile}
      />

      <View style={jobStyles.progressCopy}>
        <Text style={jobStyles.listTitle}>Interviews</Text>
        <Text style={jobStyles.modeBody}>
          Your applications currently at interview stage.
        </Text>
      </View>

      <MyApplicationsList
        applications={applications}
        onPoster={profile.openPoster}
      />
    </View>
  );
}
