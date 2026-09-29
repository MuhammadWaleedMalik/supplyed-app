import React from 'react';
import { Text, View } from 'react-native';
import type { Job } from '../../feature/dashboard/shared/apis/jobsApi';
import Button from '../Ui/Button';
import Input from '../Ui/Input';
import { applicationStyles } from './applicationStyles';
import { jobStyles } from './jobStyles';

type Props = {
  job: Job;
  coverLetter: string;
  onCoverLetter: (value: string) => void;
  onNext: () => void;
};

export default function ApplicationDetailsStep({
  job,
  coverLetter,
  onCoverLetter,
  onNext,
}: Props) {
  return (
    <View style={jobStyles.formSection}>
      <View style={jobStyles.summary}>
        <Text style={jobStyles.sectionTitle}>{job.title}</Text>
        <Text style={jobStyles.modeBody}>
          {job.subject || 'General'} · {job.city || 'Location pending'}
        </Text>
        <View style={applicationStyles.metaGrid}>
          <Text style={applicationStyles.meta}>
            {job.payAmount
              ? `${job.payAmount} ${job.payType || ''}`
              : 'Pay not listed'}
          </Text>
          <Text style={applicationStyles.meta}>
            {job.startDate?.slice(0, 10) || 'Flexible start'}
          </Text>
        </View>
      </View>
      <Text style={jobStyles.sectionTitle}>Why are you a good fit?</Text>
      <Input
        label="COVER LETTER"
        required={false}
        multiline
        value={coverLetter}
        placeholder="Share your relevant experience and availability"
        onChangeText={onCoverLetter}
      />
      <Button title="Review application" onPress={onNext} />
    </View>
  );
}
