import React from 'react';
import { StyleSheet, View } from 'react-native';
import Input from '../Ui/Input';
import DynamicSelect from '../Ui/DynamicSelect';
import { OnboardingData } from '../../utils/onboarding/onboardingData';

type Props = {
  data: OnboardingData;
  wide: boolean;
  update: (field: string, value: string | boolean) => void;
};

export default function TeacherRates({ data, wide, update }: Props) {
  return (
    <View style={styles.fields}>
      <View style={[styles.row, wide && styles.wide]}>
        <Input
          label="YEARS OF EXPERIENCE"
          placeholder="5"
          number
          required
          value={data.experience}
          onChangeText={value => update('experience', value)}
          half={wide}
        />
        <Input
          label="DAILY RATE"
          placeholder="180"
          number
          required={false}
          value={data.dailyRate}
          onChangeText={value => update('dailyRate', value)}
          half={wide}
        />
        <Input
          label="HOURLY RATE"
          placeholder="35"
          number
          required={false}
          value={data.hourlyRate}
          onChangeText={value => update('hourlyRate', value)}
          half={wide}
        />
      </View>
      <View style={[styles.row, wide && styles.wide]}>
        <View style={[styles.field, wide && styles.half]}>
          <DynamicSelect
            label="CURRENCY"
            value={data.currency}
            placeholder="Select currency"
            name="currency"
            onChange={value => update('currency', value)}
          />
        </View>
        <Input
          label="MAXIMUM TRAVEL DISTANCE"
          placeholder="25"
          number
          required={false}
          value={data.travelDistance}
          onChangeText={value => update('travelDistance', value)}
          half={wide}
        />
      </View>
      <Input
        label="TEACHING BIO"
        multiline
        required
        placeholder="Describe your classroom style and specialist subjects (at least 40 characters)."
        value={data.bio}
        onChangeText={value => update('bio', value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 16 },
  row: { gap: 12 },
  wide: { flexDirection: 'row', alignItems: 'flex-start' },
  field: { width: '100%' },
  half: { flex: 1, width: 'auto' },
});
