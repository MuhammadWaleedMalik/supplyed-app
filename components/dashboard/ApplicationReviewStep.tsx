import React from 'react';
import { Text, View } from 'react-native';
import type { Job } from '../../feature/dashboard/shared/apis/jobsApi';
import Button from '../Ui/Button';
import { applicationStyles } from './applicationStyles';
import { jobStyles } from './jobStyles';

type Props = {
  job: Job;
  coverLetter: string;
  error: string;
  loading: boolean;
  onBack: () => void;
  onSubmit: () => void;
};

export default function ApplicationReviewStep(props: Props) {
  return (
    <View style={jobStyles.formSection}>
      <Text style={jobStyles.sectionTitle}>Review your application</Text>

      <View style={jobStyles.summary}>
        <Text style={jobStyles.sectionTitle}>{props.job.title}</Text>
        <Text style={jobStyles.modeBody}>
          {props.job.subject || 'General'} |{' '}
          {props.job.city || 'Location pending'}
        </Text>
      </View>

      <View style={applicationStyles.cover}>
        <Text style={applicationStyles.coverText}>
          {props.coverLetter || 'No cover letter added.'}
        </Text>
      </View>

      {props.error ? <Text style={jobStyles.error}>{props.error}</Text> : null}

      <Button
        title={props.loading ? 'Submitting...' : 'Submit application'}
        disabled={props.loading}
        onPress={props.onSubmit}
      />
      <Button title="Back" variant="link" compact onPress={props.onBack} />
    </View>
  );
}
