import React from 'react';
import { Text, View } from 'react-native';
import type { JobForm } from '../../feature/dashboard/shared/apis/jobsApi';
import { todayInputValue } from '../../utils/jobs/dateUtils';
import Button from '../Ui/Button';
import DateField from '../Ui/DateField';
import Input from '../Ui/Input';
import Select from '../Ui/Select';
import ChoiceField from './ChoiceField';
import { jobStyles } from './jobStyles';

type Props = {
  form: JobForm;
  error: string;
  loading: boolean;
  onChange: (name: keyof JobForm, value: string) => void;
  onBack: () => void;
  onSave: () => void;
};

export default function JobRequirementsStep({
  form,
  error,
  loading,
  onChange,
  onBack,
  onSave,
}: Props) {
  return (
    <View style={jobStyles.formSection}>
      <Text style={jobStyles.sectionTitle}>Teacher requirements</Text>

      <Input
        label="MINIMUM EXPERIENCE"
        required={false}
        number
        value={form.minExperienceYears}
        onChangeText={value => onChange('minExperienceYears', value)}
      />
      <Input
        label="SKILLS"
        required={false}
        value={form.requiredSkills}
        placeholder="Classroom management, SEN"
        onChangeText={value => onChange('requiredSkills', value)}
      />
      <ChoiceField
        label="QTS required"
        value={form.qts}
        options={['yes', 'no']}
        onChange={value => onChange('qts', value)}
      />
      <ChoiceField
        label="Urgent role"
        value={form.urgent}
        options={['yes', 'no']}
        onChange={value => onChange('urgent', value)}
      />
      <Input
        label="PARKING AND ARRIVAL NOTES"
        required={false}
        multiline
        value={form.parkingInfo}
        onChangeText={value => onChange('parkingInfo', value)}
      />
      <DateField
        label="LISTING EXPIRES"
        value={form.expiresAt}
        minimum={todayInputValue()}
        onChange={value => onChange('expiresAt', value)}
      />

      <View style={jobStyles.summary}>
        <Text style={jobStyles.sectionTitle}>{form.title}</Text>
        <Text style={jobStyles.modeBody}>
          {form.subject} | {form.city || 'Location to be confirmed'}
        </Text>
      </View>

      <Select
        label="PUBLISH AS"
        value={form.status}
        placeholder="Choose status"
        options={['ACTIVE', 'DRAFT']}
        onChange={value => onChange('status', value)}
      />

      {error ? <Text style={jobStyles.error}>{error}</Text> : null}

      <View style={jobStyles.actions}>
        <Button
          title={
            loading
              ? 'Publishing...'
              : form.status === 'ACTIVE'
                ? 'Publish job'
                : 'Save draft'
          }
          onPress={onSave}
          disabled={loading}
        />
        <Button title="Back" variant="link" onPress={onBack} compact />
      </View>
    </View>
  );
}
