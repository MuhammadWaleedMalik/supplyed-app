import React from 'react';
import { View } from 'react-native';
import { OnboardingData } from '../../utils/onboarding/onboardingData';
import DynamicSelect from '../Ui/DynamicSelect';
import TeachingFields from './TeachingFields';

type Props = {
  data: OnboardingData;
  wide: boolean;
  update: (field: string, value: string | boolean) => void;
};
export default function TeacherPreferences({ data, update }: Props) {
  return (
    <View>
      <TeachingFields
        subjects={data.subjects}
        skills={data.skills}
        onSubjects={value => update('subjects', value)}
        onSkills={value => update('skills', value)}
      />
      <DynamicSelect
        name="keyStage"
        label="Key stages"
        multiple
        required
        value={data.keyStages}
        onChange={value => update('keyStages', value)}
      />
    </View>
  );
}
