import React from 'react';
import { View } from 'react-native';
import type { ProfileFields } from '../../feature/dashboard/shared/apis/settingsApi';
import TeachingFields from '../onboarding/TeachingFields';
import Input from '../Ui/Input';
import DynamicSelect from '../Ui/DynamicSelect';

import { useSettingsStyles } from './settingsStyles';

type Props = {
  fields: ProfileFields;
  wide: boolean;
  onChange: (name: keyof ProfileFields, value: string | boolean) => void;
};

export default function TeacherSettingsFields({
  fields,
  wide,
  onChange,
}: Props) {
  const settingsStyles = useSettingsStyles();

  return (
    <View style={settingsStyles.section}>
      <TeachingFields
        subjects={fields.subjects}
        skills={fields.skills}
        onSubjects={value => onChange('subjects', value)}
        onSkills={value => onChange('skills', value)}
      />
      <DynamicSelect
        name="keyStage"
        label="Key stages"
        multiple
        value={fields.keyStages}
        onChange={value => onChange('keyStages', value)}
      />
      <View style={[settingsStyles.row, wide && settingsStyles.wideRow]}>
        <View style={settingsStyles.field}>
          <Input
            label="DAILY RATE"
            number
            required={false}
            value={fields.dailyRate}
            onChangeText={value => onChange('dailyRate', value)}
          />
        </View>
        <View style={settingsStyles.field}>
          <Input
            label="HOURLY RATE"
            number
            required={false}
            value={fields.hourlyRate}
            onChangeText={value => onChange('hourlyRate', value)}
          />
        </View>
      </View>
      <View style={[settingsStyles.row, wide && settingsStyles.wideRow]}>
        <View style={settingsStyles.field}>
          <Input
            label="YEARS EXPERIENCE"
            number
            required={false}
            value={fields.experience}
            onChangeText={value => onChange('experience', value)}
          />
        </View>
        <View style={settingsStyles.field}>
          <Input
            label="MAX TRAVEL DISTANCE"
            number
            required={false}
            value={fields.maxTravelDistance}
            onChangeText={value => onChange('maxTravelDistance', value)}
          />
        </View>
      </View>
      <DynamicSelect
        label="CURRENCY"
        value={fields.currency}
        placeholder="Currency"
        name="currency"
        onChange={value => onChange('currency', value)}
      />
    </View>
  );
}
