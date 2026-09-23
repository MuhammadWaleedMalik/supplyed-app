import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Select from '../Ui/Select';
import { common } from '../Ui/theme';
import {
  keyStages,
  OnboardingData,
  skills,
  subjects,
} from '../../utils/onboarding/onboardingData';

type Props = {
  data: OnboardingData;
  wide: boolean;
  update: (field: string, value: string | boolean) => void;
};

export default function TeacherPreferences({ data, wide, update }: Props) {
  return (
    <View style={styles.fields}>
      <Text style={common.cardTitle}>Teaching profile</Text>
      <Text style={common.body}>
        Add your teaching experience and preferences to help schools find
        suitable instructors.
      </Text>
      <View style={[styles.row, wide && styles.wide]}>
        <View style={[styles.field, wide && styles.half]}>
          <Select
            label="PRIMARY SUBJECTS"
            value={data.subjects}
            placeholder="Select primary subjects"
            options={subjects}
            onChange={value => update('subjects', value)}
          />
        </View>
        <View style={[styles.field, wide && styles.half]}>
          <Select
            label="KEY STAGES"
            value={data.keyStages}
            placeholder="Select key stages"
            options={keyStages}
            onChange={value => update('keyStages', value)}
          />
        </View>
      </View>
      <Select
        label="SKILLS"
        value={data.skills}
        placeholder="Select skills"
        options={skills}
        onChange={value => update('skills', value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 12 },
  row: { gap: 12 },
  wide: { flexDirection: 'row' },
  field: { width: '100%' },
  half: { flex: 1, width: 'auto' },
});
