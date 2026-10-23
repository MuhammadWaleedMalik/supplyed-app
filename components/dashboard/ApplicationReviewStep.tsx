import React from 'react';
import { Text, View } from 'react-native';
import type { Job } from '../../feature/dashboard/shared/apis/jobsApi';
import { displayDate, displayPay } from '../../utils/ui/marketplaceLabels';
import Button from '../Ui/Button';
import RichText from '../Ui/RichText';
import { InfoGrid, Notice, RecordSection } from '../Ui/RecordLayout';
import { useStyles } from './dashboardStyles';
type Props = { job: Job; coverLetter: string; error: string; loading: boolean; onBack: () => void; onSubmit: () => void };
export default function ApplicationReviewStep(props: Props) {
  const styles = useStyles();
  return <View style={styles.section}>
    <RecordSection title="Ready to send?" subtitle="Check your introduction and placement before submitting.">
      <Text style={styles.cardTitle}>{props.job.title}</Text>
      <InfoGrid items={[{ label: 'Starts', value: displayDate(props.job.startDate) }, { label: 'Pay', value: displayPay(props.job.payAmount, props.job.payType) }, { label: 'Location', value: [props.job.address, props.job.city, props.job.postalCode].filter(Boolean).join(', ') }]} />
    </RecordSection>
    <RecordSection title="Your proposal" action={<Button title="Edit" variant="link" disabled={props.loading} onPress={props.onBack} />}><RichText value={props.coverLetter} title="Your application proposal" emptyText="No proposal added. The school can still review your teacher profile." /></RecordSection>
    {props.error ? <Notice danger text={props.error} /> : null}
    <Text style={styles.teacherMeta}>The school will receive your application and public teacher profile. You can follow its progress in My applications.</Text>
    <Button title="Submit application" loading={props.loading} onPress={props.onSubmit} />
    <Button title="Edit application" variant="outline" disabled={props.loading} onPress={props.onBack} />
  </View>;
}
