import DateField from '../Ui/DateField';
import { dateWindowErrors, hourlySummary, listingInput } from '../../utils/jobs/workSchedule';
import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import type { JobForm } from '../../feature/dashboard/shared/apis/jobsApi';
import { todayInputValue } from '../../utils/jobs/dateUtils';
import Button from '../Ui/Button';
import WorkDateField from '../Ui/WorkDateField';
import ProposalEditor from '../Ui/ProposalEditor';
import TeachingFields from '../onboarding/TeachingFields';
import Input from '../Ui/Input';
import DynamicSelect from '../Ui/DynamicSelect';
import { useJobStyles } from './jobStyles';
import type { JobAddress } from '../../utils/jobs/jobAddress';
import { hasSchoolAddress, jobAddress } from '../../utils/jobs/jobAddress';
import { protectedRequest } from '../../utils/api/request';
import { getSessionVersion } from '../../utils/api/session';
import Checkbox from '../Ui/Checkbox';
import AutoUpdatedField from '../Ui/AutoUpdatedField';

type Props = {
  form: JobForm;
  timezone?: string;
  invitation?: boolean;
  error: string;
  onChange: (name: keyof JobForm, value: string) => void;
  onAddressMode?: (mode: 'school' | 'different') => void;
  schoolAddress?: JobAddress;
  onBack: () => void;
  onNext: () => void;
  footer?: React.ReactNode;
};

export default function JobDetailsStep({
  form,
  timezone,
  invitation,
  error,
  onChange: onFieldChange,
  onAddressMode,
  schoolAddress,
  onBack,
  onNext,
  footer,
}: Props) {
  const jobStyles = useJobStyles();
  const [loadedAddress, setLoadedAddress] = useState<JobAddress>();
  const [addressError, setAddressError] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const alternate = useRef(jobAddress(form));
  const edit = useRef<keyof JobForm | undefined>(undefined);
  const previous = useRef(form);
  const [updated, setUpdated] = useState<string[]>([]);
  const effectiveAddress = schoolAddress || loadedAddress;
  useEffect(() => {
    if (onAddressMode) return;
    let active = true;
    const version = getSessionVersion();
    setAddressLoading(true);
    protectedRequest<Partial<JobAddress>>('/institutions/me').then(profile => {
      if (!active || version !== getSessionVersion()) return;
      if (hasSchoolAddress(profile)) setLoadedAddress(jobAddress(profile));
      else setAddressError('Add your school address in Profile settings, or enter a job location below.');
    }).catch(() => { if (active) setAddressError('School address unavailable. Enter the job location below.'); })
      .finally(() => { if (active) setAddressLoading(false); });
    return () => { active = false; };
  }, [onAddressMode]);
  useEffect(() => {
    const fields = ['startDate', 'endDate', 'hours', 'days'] as const;
    const changed = edit.current && fields.includes(edit.current as typeof fields[number])
      ? fields.filter(field => field !== edit.current && form[field] !== previous.current[field]) : [];
    previous.current = form;
    edit.current = undefined;
    if (!changed.length) return;
    setUpdated(changed);
  }, [form]);
  useEffect(() => {
    if (!updated.length) return;
    const timer = setTimeout(() => setUpdated([]), 1800);
    return () => clearTimeout(timer);
  }, [updated]);
  function onChange(name: keyof JobForm, value: string) {
    edit.current = name;
    onFieldChange(name, value);
  }
  function chooseAddress(useSchool: boolean) {
    if (onAddressMode) { onAddressMode(useSchool ? 'school' : 'different'); return; }
    if (useSchool && !effectiveAddress) return;
    if (useSchool) alternate.current = jobAddress(form);
    const address = useSchool ? effectiveAddress! : alternate.current;
    for (const field of ['address', 'city', 'county', 'postalCode', 'countryCode'] as const)
      onFieldChange(field, address[field]);
    onFieldChange('addressMode', useSchool ? 'school' : 'different');
  }

  const today = todayInputValue();
  const dateErrors = dateWindowErrors(form, timezone);
  const listingError = /listing|live from|opening/i.test(error) ? error : '';
  const workError =
    !listingError && /work|start|end|time|date/i.test(error) ? error : '';
  return (
    <View style={jobStyles.formSection}>
      <Text style={jobStyles.sectionTitle}>Role location</Text>
      <Checkbox label="Use School Address as Job Location" checked={form.addressMode === 'school'} onChange={() => chooseAddress(form.addressMode !== 'school')} disabled={!effectiveAddress || addressLoading} />
      {addressError || (!effectiveAddress && !addressLoading) ? <Text style={jobStyles.error}>{addressError || 'No saved school address is available. Enter the job location below.'}</Text> : null}
      {addressLoading ? <Text style={jobStyles.modeBody}>Loading school address…</Text> : null}
      {form.addressMode === 'school' && effectiveAddress ? (
        <Text style={jobStyles.modeBody}>
          Teachers will see this school address on the role and booking.
        </Text>
      ) : null}
      <Input
        label="ADDRESS"
        value={form.address}
        onChangeText={value => onChange('address', value)}
        disabled={form.addressMode === 'school'}
      />
      <DynamicSelect
        name="country"
        label="COUNTRY"
        value={form.countryCode}
        allowed={['GB']}
        onChange={value => onChange('countryCode', value)}
        disabled={form.addressMode === 'school'}
      />
      <DynamicSelect
        name="city"
        label="CITY"
        value={form.city}
        onChange={value => onChange('city', value)}
        disabled={form.addressMode === 'school'}
      />
      <DynamicSelect
        name="region"
        label="COUNTY"
        required={false}
        value={form.county}
        onChange={value => onChange('county', value)}
        disabled={form.addressMode === 'school'}
      />
      <Input
        label="POSTCODE"
        value={form.postalCode}
        onChangeText={value => onChange('postalCode', value)}
        disabled={form.addressMode === 'school'}
      />
      <Text style={jobStyles.sectionTitle}>Pay</Text>
      <DynamicSelect
        label="PAY BASIS"
        value={form.payType}
        placeholder="Choose pay basis"
        name="payType"
        onChange={value => onChange('payType', value)}
      />
      <Input
        label="PAY AMOUNT"
        number
        value={form.payAmount}
        onChangeText={value => onChange('payAmount', value)}
      />
      <Text style={jobStyles.sectionTitle}>Work schedule</Text>
      <AutoUpdatedField active={updated.includes('startDate')}><WorkDateField
        timezone={timezone}
        label="START DATE"
        value={form.startDate}
        error={dateErrors.startDate}
        minimum={today}
        onChange={value => onChange('startDate', value)}
      /></AutoUpdatedField>
      <AutoUpdatedField active={updated.includes('endDate')}><WorkDateField
        timezone={timezone}
        label="END DATE"
        value={form.endDate}
        error={dateErrors.endDate}
        minimum={form.startDate || today}
        onChange={value => onChange('endDate', value)}
      /></AutoUpdatedField>
      {workError ? (
        <Text accessibilityRole="alert" style={jobStyles.error}>
          {workError}
        </Text>
      ) : null}
      {form.payType === 'hourly' || form.payType === 'daily' ? (
        <AutoUpdatedField active={updated.includes(form.payType === 'hourly' ? 'hours' : 'days')}><Input
          label={
            form.payType === 'hourly'
              ? 'TOTAL PLANNED HOURS'
              : 'TOTAL PLANNED DAYS'
          }
          required={false}
          number
          value={form.payType === 'hourly' ? form.hours : form.days}
          onChangeText={value =>
            onChange(form.payType === 'hourly' ? 'hours' : 'days', value)
          }
        /></AutoUpdatedField>
      ) : null}
      {form.scheduleError ? (
        <Text accessibilityRole="alert" style={jobStyles.error}>
          {form.scheduleError}
        </Text>
      ) : null}
      {hourlySummary(form) ? (
        <Text style={jobStyles.modeBody}>{hourlySummary(form)}</Text>
      ) : null}
      <DateField
        label="LIVE FROM"
        value={listingInput(form.liveFrom)}
        error={dateErrors.liveFrom}
        minimum={today}
        onChange={value => onChange('liveFrom', value)}
      />
      {form.liveFrom ? (
        <Button
          title="Clear opening date"
          variant="link"
          onPress={() => onChange('liveFrom', '')}
        />
      ) : null}
      <DateField
        label="LISTING EXPIRY"
        value={listingInput(form.expiresAt, true)}
        error={dateErrors.expiresAt}
        minimum={today}
        onChange={value => onChange('expiresAt', value)}
      />
      {listingError ? (
        <Text accessibilityRole="alert" style={jobStyles.error}>
          {listingError}
        </Text>
      ) : null}
      <Text style={jobStyles.modeBody}>
        Listing days use UK time. Expiry includes the whole selected day and
        must close before work starts. Live date → listing expiry → work start → work end.
      </Text>
      {form.liveFrom.includes('T') || form.expiresAt.includes('T') ? (
        <Text style={jobStyles.modeBody}>
          Saved exact listing times are retained until you edit their date.
          {form.liveFrom.includes('T')
            ? ` Opens: ${new Date(form.liveFrom).toLocaleString('en-GB', {
                timeZone: 'Europe/London',
                timeZoneName: 'short',
              })}.`
            : ''}
          {form.expiresAt.includes('T')
            ? ` Closes: ${new Date(form.expiresAt).toLocaleString('en-GB', {
                timeZone: 'Europe/London',
                timeZoneName: 'short',
              })}.`
            : ''}
        </Text>
      ) : null}
      <Text style={jobStyles.sectionTitle}>Role information</Text>
      <Input
        label="JOB TITLE"
        value={form.title}
        onChangeText={value => onChange('title', value)}
      />
      <TeachingFields
        subjects={form.subject}
        skills={form.requiredSkills}
        onSubjects={value => onChange('subject', value)}
        onSkills={value => onChange('requiredSkills', value)}
      />
      <ProposalEditor
        role
        value={form.description}
        onChange={value => onChange('description', value)}
      />
      {invitation ? (
        <DynamicSelect
          name="keyStage"
          label="KEY STAGES"
          multiple
          value={form.keyStages}
          onChange={value => onChange('keyStages', value)}
        />
      ) : null}
      {footer}
      {error ? <Text style={jobStyles.error}>{error}</Text> : null}
      <View style={jobStyles.actions}>
        <Button title="Continue" disabled={Object.keys(dateErrors).length > 0 || !!form.scheduleError} onPress={onNext} />
        <Button title="Back" variant="link" onPress={onBack} compact />
      </View>
    </View>
  );
}
