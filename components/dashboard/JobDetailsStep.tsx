import React from 'react';
import { Text, View } from 'react-native';
import { jobKeyStages, jobSubjects, payTypes } from '../../constants/jobOptions';
import type { JobForm } from '../../feature/dashboard/shared/apis/jobsApi';
import { todayInputValue } from '../../utils/jobs/dateUtils';
import Button from '../Ui/Button';
import DateField from '../Ui/DateField';
import Input from '../Ui/Input';
import Select from '../Ui/Select';
import { jobStyles } from './jobStyles';

type Props = { form: JobForm; error: string; onChange: (name: keyof JobForm, value: string) => void;
  onBack: () => void; onNext: () => void };

export default function JobDetailsStep({ form, error, onChange, onBack, onNext }: Props) {
  const today = todayInputValue();
  return (
    <View style={jobStyles.formSection}>
      <Text style={jobStyles.sectionTitle}>Role information</Text>
      <Input label="JOB TITLE" value={form.title} onChangeText={value => onChange('title', value)} />
      <Select label="SUBJECT" value={form.subject} placeholder="Choose subject" options={jobSubjects}
        onChange={value => onChange('subject', value)} required />
      <Input label="DESCRIPTION" multiline value={form.description}
        placeholder="Describe the role, class, and expected outcome"
        onChangeText={value => onChange('description', value)} />
      <Select label="KEY STAGE" value={form.keyStages} placeholder="Choose key stage" options={jobKeyStages}
        onChange={value => onChange('keyStages', value)} />
      <Text style={jobStyles.sectionTitle}>Location and dates</Text>
      <Input label="ADDRESS" value={form.address} onChangeText={value => onChange('address', value)} />
      <Input label="CITY" value={form.city} onChangeText={value => onChange('city', value)} />
      <Input label="COUNTY" required={false} value={form.county} onChangeText={value => onChange('county', value)} />
      <Input label="POSTCODE" value={form.postalCode} onChangeText={value => onChange('postalCode', value)} />
      <DateField label="START DATE" value={form.startDate} minimum={today}
        onChange={value => onChange('startDate', value)} />
      <DateField label="END DATE" value={form.endDate} minimum={form.startDate || today}
        onChange={value => onChange('endDate', value)} />
      <Text style={jobStyles.sectionTitle}>Pay</Text>
      <Input label="PAY AMOUNT" number value={form.payAmount} onChangeText={value => onChange('payAmount', value)} />
      <Select label="PAY BASIS" value={form.payType} placeholder="Choose pay basis" options={payTypes}
        onChange={value => onChange('payType', value)} />
      {error ? <Text style={jobStyles.error}>{error}</Text> : null}
      <View style={jobStyles.actions}>
        <Button title="Continue" onPress={onNext} />
        <Button title="Back" variant="link" onPress={onBack} compact />
      </View>
    </View>
  );
}
