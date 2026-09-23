import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Input from '../Ui/Input';
import Select from '../Ui/Select';
import { colors } from '../Ui/theme';
import {
  AccountType,
  cities,
  countries,
  OnboardingData,
} from '../../utils/onboarding/onboardingData';
import { requiredError } from '../../utils/onboarding/onboardingUtils';

type Props = {
  type: AccountType | null;
  data: OnboardingData;
  wide: boolean;
  attempted: boolean;
  update: (field: string, value: string | boolean) => void;
};

export default function AccountFields({
  type,
  data,
  wide,
  attempted,
  update,
}: Props) {
  return (
    <View style={styles.fields}>
      <View style={[styles.row, wide && styles.wide]}>
        <Input
          label="FULL NAME"
          placeholder="Your full name"
          value={data.fullName}
          onChangeText={value => update('fullName', value)}
          half={wide}
          error={requiredError(data.fullName, attempted)}
        />
        <View style={[styles.phone, wide && styles.half]}>
          <Input
            label="PHONE"
            placeholder="+44 7700 900000"
            phone
            required={false}
            value={data.phone}
            onChangeText={value => update('phone', value)}
          />
          <Text style={styles.hint}>Required for full verification later.</Text>
        </View>
      </View>
      {type !== 'school' && (
        <View style={[styles.row, wide && styles.wide]}>
          <View style={[styles.field, wide && styles.half]}>
            <Select
              label="COUNTRY"
              value={data.country}
              placeholder="Select country"
              options={countries}
              onChange={value => update('country', value)}
            />
          </View>
          <View style={[styles.field, wide && styles.half]}>
            <Select
              label="CITY"
              value={data.city}
              placeholder="Select city"
              options={cities}
              onChange={value => update('city', value)}
            />
          </View>
        </View>
      )}
      <View style={[styles.field, wide && styles.half]}>
        <Input
          label="POSTAL CODE"
          placeholder="M1 1AE"
          required={false}
          value={data.postcode}
          onChangeText={value => update('postcode', value)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 16 },
  row: { gap: 12 },
  wide: { flexDirection: 'row', alignItems: 'flex-start' },
  field: { width: '100%' },
  half: { flex: 1, width: 'auto' },
  phone: { width: '100%', gap: 2 },
  hint: { color: colors.muted, fontSize: 11 },
});
