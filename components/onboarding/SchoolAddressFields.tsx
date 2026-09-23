import React from 'react';
import { StyleSheet, View } from 'react-native';
import Input from '../Ui/Input';
import Select from '../Ui/Select';
import {
  cities,
  countries,
  OnboardingData,
  staffingNeeds,
} from '../../utils/onboarding/onboardingData';
import { requiredError } from '../../utils/onboarding/onboardingUtils';

type Props = {
  data: OnboardingData;
  wide: boolean;
  attempted: boolean;
  update: (field: string, value: string | boolean) => void;
};

export default function SchoolAddressFields({
  data,
  wide,
  attempted,
  update,
}: Props) {
  return (
    <View style={styles.fields}>
      <View style={[styles.row, wide && styles.wide]}>
        <Input
          label="ADDRESS"
          placeholder="1 School Lane"
          value={data.address}
          onChangeText={value => update('address', value)}
          error={requiredError(data.address, attempted)}
          half={wide}
        />
        <View style={[styles.field, wide && styles.half]}>
          <Select
            label="COUNTRY"
            value={data.country}
            placeholder="Select country"
            options={countries}
            onChange={value => update('country', value)}
            required
          />
        </View>
      </View>
      <View style={[styles.row, wide && styles.wide]}>
        <View style={[styles.field, wide && styles.half]}>
          <Select
            label="CITY"
            value={data.city}
            placeholder="Select city"
            options={cities}
            onChange={value => update('city', value)}
            required
            error={requiredError(data.city, attempted)}
          />
        </View>
        <Input
          label="TYPICAL PUPIL COUNT"
          placeholder="420"
          number
          required={false}
          value={data.pupilCount}
          onChangeText={value => update('pupilCount', value)}
          half={wide}
        />
      </View>
      <Select
        label="STAFFING NEEDS"
        value={data.staffingNeeds}
        placeholder="Select staffing needs"
        options={staffingNeeds}
        onChange={value => update('staffingNeeds', value)}
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
