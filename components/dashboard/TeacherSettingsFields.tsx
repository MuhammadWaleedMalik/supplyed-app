import React from 'react';
import { View } from 'react-native';
import type { ProfileFields } from '../../feature/dashboard/shared/apis/settingsApi';
import Input from '../Ui/Input';
import Select from '../Ui/Select';
import { currencies } from '../../utils/onboarding/onboardingData';
import { settingsStyles } from './settingsStyles';

type Props = { fields: ProfileFields; wide: boolean;
  onChange: (name: keyof ProfileFields, value: string | boolean) => void };

export default function TeacherSettingsFields({ fields, wide, onChange }: Props) {
  return <View style={settingsStyles.section}>
    <Input label="SUBJECTS" required={false} value={fields.subjects}
      placeholder="Maths, Science" onChangeText={value => onChange('subjects', value)} />
    <Input label="KEY STAGES" required={false} value={fields.keyStages}
      placeholder="KS2, KS3" onChangeText={value => onChange('keyStages', value)} />
    <Input label="SKILLS" required={false} value={fields.skills}
      placeholder="SEN, Classroom management" onChangeText={value => onChange('skills', value)} />
    <View style={[settingsStyles.row, wide && settingsStyles.wideRow]}>
      <View style={settingsStyles.field}><Input label="DAILY RATE" number required={false} value={fields.dailyRate}
        onChangeText={value => onChange('dailyRate', value)} /></View>
      <View style={settingsStyles.field}><Input label="HOURLY RATE" number required={false} value={fields.hourlyRate}
        onChangeText={value => onChange('hourlyRate', value)} /></View>
    </View>
    <View style={[settingsStyles.row, wide && settingsStyles.wideRow]}>
      <View style={settingsStyles.field}><Input label="YEARS EXPERIENCE" number required={false} value={fields.experience}
        onChangeText={value => onChange('experience', value)} /></View>
      <View style={settingsStyles.field}><Input label="MAX TRAVEL DISTANCE" number required={false}
        value={fields.maxTravelDistance} onChangeText={value => onChange('maxTravelDistance', value)} /></View>
    </View>
    <Select label="CURRENCY" value={fields.currency} placeholder="Currency" options={currencies}
      onChange={value => onChange('currency', value)} />
  </View>;
}
