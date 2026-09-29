import { Building2 } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import type { ProfileFields } from '../../feature/dashboard/shared/apis/settingsApi';
import type { AccountType } from '../../utils/onboarding/onboardingData';
import CommonProfileFields from './CommonProfileFields';
import SchoolSettingsFields from './SchoolSettingsFields';
import SettingsCardHeader from './SettingsCardHeader';
import { settingsStyles } from './settingsStyles';
import TeacherSettingsFields from './TeacherSettingsFields';

type Props = {
  type: AccountType;
  fields: ProfileFields;
  wide: boolean;
  onChange: (name: keyof ProfileFields, value: string | boolean) => void;
};

export default function ProfileSettingsCard({
  type,
  fields,
  wide,
  onChange,
}: Props) {
  const title = type === 'school' ? 'INSTITUTION PROFILE' : 'TEACHER PROFILE';
  return (
    <View style={settingsStyles.card}>
      <SettingsCardHeader
        icon={Building2}
        title={title}
        note="Role details used across jobs, applications, and matching."
      />
      <CommonProfileFields
        fields={fields}
        wide={wide}
        showBio={type === 'teacher'}
        onChange={onChange}
      />
      {type === 'teacher' ? (
        <TeacherSettingsFields
          fields={fields}
          wide={wide}
          onChange={onChange}
        />
      ) : null}
      {type === 'school' ? (
        <SchoolSettingsFields fields={fields} wide={wide} onChange={onChange} />
      ) : null}
    </View>
  );
}
