import { choiceText } from '../../utils/ui/choices';
import RichText from '../Ui/RichText';
import React from 'react';
import { Text, View } from 'react-native';
import type { JobForm } from '../../feature/dashboard/shared/apis/jobsApi';
import Button from '../Ui/Button';
import Input from '../Ui/Input';
import DynamicSelect from '../Ui/DynamicSelect';
import ChoiceField from './ChoiceField';
import { useJobStyles } from './jobStyles';

type Props = {
  form: JobForm;
  draftOnly?: boolean;
  published?: boolean;
  error: string;
  loading: boolean;
  onChange: (name: keyof JobForm, value: string) => void;
  onBack: () => void;
  onSave: () => void;
};

export default function JobRequirementsStep({
  form,
  draftOnly,
  published,
  error,
  loading,
  onChange,
  onBack,
  onSave,
}: Props) {
  const jobStyles = useJobStyles();

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
      <DynamicSelect
        label="KEY STAGES"
        multiple
        value={form.keyStages}
        placeholder="Choose key stage"
        name="keyStage"
        onChange={value => onChange('keyStages', value)}
      />
      <View style={jobStyles.summary}>
        <Text style={jobStyles.sectionTitle}>{form.title}</Text>
        <Text style={jobStyles.modeBody}>
          {choiceText(form.subject)} | {form.city || 'Location to be confirmed'}
        </Text>
      </View>

      <RichText value={form.description} />
      <DynamicSelect
        name="jobStatus"
        label="PUBLISH AS"
        value={form.status}
        placeholder="Choose status"
        allowed={
          published ? ['ACTIVE'] : draftOnly ? ['DRAFT'] : ['ACTIVE', 'DRAFT']
        }
        onChange={value => onChange('status', value)}
      />

      {error ? <Text style={jobStyles.error}>{error}</Text> : null}

      <View style={jobStyles.actions}>
        <Button title="Review job" onPress={onSave} disabled={loading} />
        <Button title="Back" variant="link" onPress={onBack} compact />
      </View>
    </View>
  );
}
