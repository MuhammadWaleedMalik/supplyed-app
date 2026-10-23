import React, { useState } from 'react';
import { Text, View } from 'react-native';
import ChoiceField from '../../../../components/dashboard/ChoiceField';
import InvitationsScreen from '../../shared/screens/InvitationsScreen';
import LimitedProfileCard from '../../../../components/dashboard/LimitedProfileCard';
import MyApplicationsList from '../../../../components/dashboard/MyApplicationsList';
import ApplicationFilterBar from '../../../../components/dashboard/ApplicationFilterBar';
import { useStyles } from '../../../../components/dashboard/dashboardStyles';
import { useTeacherApplications } from '../hooks/useTeacherApplications';
import { useLimitedProfile } from '../../shared/hooks/useLimitedProfile';
export default function TeacherApplicationsScreen() {
  const styles = useStyles();
  const [view, setView] = useState('Applications');
  const applications = useTeacherApplications();
  const profile = useLimitedProfile();
  const choice = <ChoiceField hideLabel label="View" value={view} options={['Applications', 'Invited']} onChange={setView} />;
  return <View style={styles.scroll}>
    <LimitedProfileCard profile={profile.profile} error={profile.error} loading={profile.loading} onClose={profile.closeProfile} />
    {view === 'Invited' ? <InvitationsScreen role="teacher" header={choice} /> : <MyApplicationsList
      applications={applications.applications} onSchool={profile.openApplicationSchool}
      header={<>{choice}<Text style={styles.title}>My applications</Text><Text style={styles.cardBody}>Follow each role from your first introduction to your next booking.</Text><ApplicationFilterBar search={applications.search} status={applications.status} onSearch={applications.setSearch} onStatus={applications.setStatus} /></>}
      loading={applications.loading} error={applications.error} hasMore={applications.hasMore} onMore={applications.loadMore} onRefresh={applications.refresh} />}
  </View>;
}
