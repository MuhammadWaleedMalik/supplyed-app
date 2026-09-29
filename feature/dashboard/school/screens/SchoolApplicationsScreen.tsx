import React from 'react';
import { Text, View } from 'react-native';
import ApplicationFilterBar from '../../../../components/dashboard/ApplicationFilterBar';
import SchoolApplicationDetail from '../../../../components/dashboard/SchoolApplicationDetail';
import SchoolApplicationList from '../../../../components/dashboard/SchoolApplicationList';
import Button from '../../../../components/Ui/Button';
import { jobStyles } from '../../../../components/dashboard/jobStyles';
import { useSchoolApplications } from '../hooks/useSchoolApplications';

export default function SchoolApplicationsScreen() {
  const applications = useSchoolApplications();

  if (applications.selectedApplication) {
    return (
      <SchoolApplicationDetail
        application={applications.selectedApplication}
        onBack={applications.closeApplication}
        onStatus={applications.updateStatus}
        onMessage={applications.messageTeacher}
      />
    );
  }

  return (
    <View style={jobStyles.shell}>
      <View style={jobStyles.progressCopy}>
        <Text style={jobStyles.listTitle}>Applications</Text>
        <Text style={jobStyles.modeBody}>
          Applications received for your posted jobs.
        </Text>
      </View>

      {applications.selectedJobId ? (
        <Button
          title="Show applications for all jobs"
          variant="link"
          compact
          onPress={applications.showAllApplications}
        />
      ) : null}

      <ApplicationFilterBar
        search={applications.search}
        status={applications.status}
        onSearch={applications.setSearch}
        onStatus={applications.setStatus}
      />

      {applications.loading ? (
        <Text style={jobStyles.modeBody}>Loading applications...</Text>
      ) : (
        <SchoolApplicationList
          applications={applications.applications}
          onOpen={applications.openApplication}
        />
      )}

      {applications.error ? (
        <Text style={jobStyles.error}>{applications.error}</Text>
      ) : null}
    </View>
  );
}
