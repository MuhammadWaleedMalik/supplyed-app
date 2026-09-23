import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../Ui/theme';
import { OnboardingData } from '../../utils/onboarding/onboardingData';
import TeacherPreferences from './TeacherPreferences';
import TeacherRates from './TeacherRates';

type Props = {
  data: OnboardingData;
  wide: boolean;
  update: (field: string, value: string | boolean) => void;
};

export default function TeacherFields({ data, wide, update }: Props) {
  return (
    <View style={styles.card}>
      <TeacherPreferences data={data} wide={wide} update={update} />
      <TeacherRates data={data} wide={wide} update={update} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.soft,
    padding: 16,
    gap: 20,
  },
});
