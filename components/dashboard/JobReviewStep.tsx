import React from 'react';
import { Text, View } from 'react-native';
import { JobForm } from '../../feature/dashboard/shared/apis/jobsApi';
import { choiceText } from '../../utils/ui/choices';
import Button from '../Ui/Button';
import RichText from '../Ui/RichText';
import { useJobStyles } from './jobStyles';

type Props = {
  form: JobForm;
  error: string;
  loading: boolean;
  onSave: () => void;
  onBack: () => void;
};
export default function JobReviewStep({
  form,
  error,
  loading,
  onSave,
  onBack,
}: Props) {
  const styles = useJobStyles();
  return (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Review your job</Text>
      <Text style={styles.sectionTitle}>{form.title}</Text>
      <RichText value={form.description} />
      <Text style={styles.modeBody}>Subjects: {choiceText(form.subject)}</Text>
      <Text style={styles.modeBody}>
        Skills: {choiceText(form.requiredSkills) || 'None selected'}
      </Text>
      <Text style={styles.modeBody}>
        Key stages: {choiceText(form.keyStages) || 'None selected'}
      </Text>
      <Text style={styles.modeBody}>
        {[form.address, form.city, form.county, form.postalCode]
          .filter(Boolean)
          .join(', ')}
      </Text>
      <Text style={styles.modeBody}>
        {form.startDate} to {form.endDate} (UK time)
      </Text>
      <Text style={styles.modeBody}>
        GBP {form.payAmount || 'Not provided'} · {form.payType}
        {form.payType === 'hourly' && form.hours
          ? ` | ${form.hours} planned hours`
          : form.payType === 'daily' && form.days
          ? ` | ${form.days} planned days`
          : ''}
      </Text>
      <Text style={styles.modeBody}>
        Opens: {form.liveFrom || 'Immediately when published'} · Closes:{' '}
        {form.expiresAt || 'No closing date'}
      </Text>
      <Text style={styles.modeBody}>Save as: {form.status}</Text>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Button
        title={
          loading
            ? 'Saving…'
            : form.status === 'ACTIVE'
            ? 'Publish job'
            : 'Save draft'
        }
        disabled={loading}
        onPress={onSave}
      />
      <Button
        title="Back to requirements"
        disabled={loading}
        onPress={onBack}
        variant="link"
      />
    </View>
  );
}
