import { Building2, GraduationCap } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import type { ProfileFields } from '../../feature/dashboard/shared/apis/settingsApi';
import type { AccountType } from '../../utils/onboarding/onboardingData';
import CommonProfileFields from './CommonProfileFields';
import SchoolSettingsFields from './SchoolSettingsFields';
import SettingsCardHeader from './SettingsCardHeader';
import { useSettingsStyles } from './settingsStyles';
import TeacherSettingsFields from './TeacherSettingsFields';

type Props = {
  type: AccountType;
  fields: ProfileFields;
  fieldErrors?: Partial<Record<keyof ProfileFields, string>>;
  wide: boolean;
  onChange: (name: keyof ProfileFields, value: string | boolean) => void;
};

export default function ProfileSettingsCard({
  type,
  fields,
  fieldErrors,
  wide,
  onChange,
}: Props) {
  const settingsStyles = useSettingsStyles();

  const title = type === 'school' ? 'INSTITUTION PROFILE' : 'TEACHER PROFILE';
  if (type === 'school') {
    return (
      <View style={settingsStyles.card}>
        <SettingsCardHeader
          icon={Building2}
          title={title}
          note="Role details used across jobs, applications, and matching."
        />
        <CommonProfileFields
          fieldErrors={fieldErrors}
          fields={fields}
          wide={wide}
          showBio={false}
          onChange={onChange}
        />
        <SchoolSettingsFields fields={fields} wide={wide} onChange={onChange} />
      </View>
    );
  }
  return (
    <View style={settingsStyles.section}>
      <View style={settingsStyles.card}>
        <SettingsCardHeader
          icon={Building2}
          title={title}
          note="Your public introduction and professional details."
        />
        <CommonProfileFields
          fieldErrors={fieldErrors}
          fields={fields}
          wide={wide}
          showBio={type === 'teacher'}
          onChange={onChange}
        />
      </View>
      {type === 'teacher' ? (
        <View style={settingsStyles.card}>
          <SettingsCardHeader
            icon={GraduationCap}
            title="TEACHING PREFERENCES"
            note="Subjects, skills, key stages, experience, travel and rates used for matching."
          />
          <TeacherSettingsFields fields={fields} wide={wide} onChange={onChange} />
        </View>
      ) : null}
    </View>
  );
}
