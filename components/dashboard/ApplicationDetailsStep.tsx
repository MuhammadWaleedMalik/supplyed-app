import React from 'react';
import { Text, View } from 'react-native';
import type { Job } from '../../feature/dashboard/shared/apis/jobsApi';
import { displayDate, displayPay } from '../../utils/ui/marketplaceLabels';
import Button from '../Ui/Button';
import ProposalEditor from '../Ui/ProposalEditor';
import RichText from '../Ui/RichText';
import { InfoGrid, RecordSection } from '../Ui/RecordLayout';
import { useStyles } from './dashboardStyles';
type Props = { job: Job; coverLetter: string; onCoverLetter: (value: string) => void; onNext: () => void };
export default function ApplicationDetailsStep({ job, coverLetter, onCoverLetter, onNext }: Props) {
  const styles = useStyles();
  return <View style={styles.section}>
    <RecordSection title={job.title} subtitle={job.institution?.name || 'Your next teaching opportunity'}>
      <InfoGrid items={[{ label: 'Starts', value: displayDate(job.startDate) }, { label: 'Pay', value: displayPay(job.payAmount, job.payType) }, { label: 'Location', value: [job.address, job.city, job.postalCode].filter(Boolean).join(', ') }]} />
      <RichText value={job.description} title="Role description" emptyText="No role description added." />
    </RecordSection>
    <View><Text style={styles.cardTitle}>Make your introduction</Text><Text style={styles.cardBody}>Tell the school about your relevant experience and why this role suits you. A proposal is optional; your teacher profile is included with your application.</Text></View>
    <ProposalEditor value={coverLetter} onChange={onCoverLetter} />
    <Button title="Review application" onPress={onNext} />
  </View>;
}
