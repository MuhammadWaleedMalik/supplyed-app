import React from 'react';
import { Alert, Text, View } from 'react-native';
import type { SchoolApplication } from '../../feature/dashboard/school/store/schoolSlice';
import Button from '../Ui/Button';
import { applicationStyles } from './applicationStyles';
import { styles } from './dashboardStyles';
import { jobStyles } from './jobStyles';
import TeacherProfileSummary from './TeacherProfileSummary';

type Props = {
  application: SchoolApplication;
  onBack: () => void;
  onStatus: (id: string, status: string) => void;
  onMessage: (teacherId: string) => void;
};

const hiringSteps = [
  {
    status: 'VIEWED',
    action: 'Mark as viewed',
    complete: 'Application viewed',
  },
  {
    status: 'SHORTLISTED',
    action: 'Shortlist teacher',
    complete: 'Teacher shortlisted',
  },
  {
    status: 'INTERVIEW',
    action: 'Book interview',
    complete: 'Interview booked',
  },
  {
    status: 'HIRED',
    action: 'Hire teacher',
    complete: 'Teacher hired',
  },
];

export default function SchoolApplicationDetail(props: Props) {
  const application = props.application;
  const currentIndex = hiringSteps.findIndex(
    step => step.status === application.status,
  );
  const canProgress = application.status !== 'REJECTED' && application.status !== 'HIRED';

  function changeStatus(nextStatus: string) {
    if (nextStatus !== 'HIRED') {
      props.onStatus(application.id, nextStatus);
      return;
    }

    Alert.alert(
      'Hire this teacher?',
      'Hiring creates a booking and closes this job. This cannot be undone from the application.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Hire teacher', onPress: () => props.onStatus(application.id, nextStatus) },
      ],
    );
  }

  return (
    <View style={jobStyles.shell}>
      <View style={jobStyles.progressCopy}>
        <Text style={jobStyles.listTitle}>{application.job.title}</Text>
        <Text style={jobStyles.modeBody}>
          Complete application and teacher profile
        </Text>
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.cardTitle}>Application status</Text>
        <View style={applicationStyles.status}>
          <Text style={applicationStyles.statusText}>
            {application.status}
          </Text>
        </View>
      </View>

      <TeacherProfileSummary teacherId={application.instructorId} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Application</Text>
        <Text style={jobStyles.sectionTitle}>Cover letter</Text>
        <View style={applicationStyles.cover}>
          <Text style={applicationStyles.coverText}>
            {application.coverLetter || 'No cover letter added.'}
          </Text>
        </View>
        <Text style={styles.teacherMeta}>
          Submitted {application.createdAt?.slice(0, 10) || 'recently'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.cardTitle}>Hiring progress</Text>
        <Text style={styles.cardBody}>
          Hire is final for the application. After hire, manage the work on the Bookings tab.
        </Text>

        <View style={applicationStyles.workflow}>
          {hiringSteps.map((step, index) => {
            const isComplete = index <= currentIndex;
            const isNext = canProgress && index === currentIndex + 1;

            return (
              <Button
                key={step.status}
                title={isComplete ? step.complete : step.action}
                variant={isNext ? 'primary' : 'social'}
                disabled={!isNext}
                onPress={() => changeStatus(step.status)}
              />
            );
          })}
        </View>
      </View>

      <Button
        title="Message teacher"
        variant="social"
        onPress={() => props.onMessage(application.instructorId)}
      />
      <Button
        compact
        variant="link"
        title="Back to applications"
        onPress={props.onBack}
      />
    </View>
  );
}
