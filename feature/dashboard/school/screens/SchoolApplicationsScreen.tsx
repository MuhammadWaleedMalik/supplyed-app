import { useTheme } from '../../../../components/Ui/theme';
import React from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import ApplicationFilterBar from '../../../../components/dashboard/ApplicationFilterBar';
import SchoolApplicationDetail from '../../../../components/dashboard/SchoolApplicationDetail';
import SchoolApplicationList from '../../../../components/dashboard/SchoolApplicationList';
import Button from '../../../../components/Ui/Button';
import { useJobStyles } from '../../../../components/dashboard/jobStyles';
import { useSchoolApplications } from '../hooks/useSchoolApplications';
import { useStyles } from '../../../../components/dashboard/dashboardStyles';

export default function SchoolApplicationsScreen({
  jobId = '',
}: {
  jobId?: string;
}) {
  const { colors } = useTheme();
  const jobStyles = useJobStyles();
  const styles = useStyles();

  const applications = useSchoolApplications(jobId);

  return (
    <View style={jobStyles.shell}>
      <View style={jobStyles.progressCopy}>
        <Text style={jobStyles.listTitle}>Applications</Text>
        <Text style={jobStyles.modeBody}>
          {jobId
            ? 'Teachers who applied for this job.'
            : 'Applications received for all your posted jobs.'}
        </Text>
      </View>

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
      {applications.selectedApplication ? (
        <Modal
          visible
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={applications.closeApplication}
        >
          <SafeAreaProvider>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.detailHeader}>
                <Button
                  title={
                    jobId ? 'Back to job applications' : 'Back to applications'
                  }
                  variant="link"
                  icon={<ArrowLeft size={20} color={colors.brandDark} />}
                  onPress={applications.closeApplication}
                />
              </View>
              <ScrollView
                contentContainerStyle={styles.page}
                keyboardShouldPersistTaps="handled"
              >
                <SchoolApplicationDetail
                  application={applications.selectedApplication}
                  onBack={applications.closeApplication}
                  onStatus={applications.updateStatus}
                  busy={applications.loading}
                  onMessage={applications.messageTeacher}
                />
                {applications.error ? (
                  <Text style={jobStyles.error}>{applications.error}</Text>
                ) : null}
              </ScrollView>
            </SafeAreaView>
          </SafeAreaProvider>
        </Modal>
      ) : null}
    </View>
  );
}
