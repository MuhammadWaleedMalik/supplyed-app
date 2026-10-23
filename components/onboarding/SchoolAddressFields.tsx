import React from 'react';
import { StyleSheet, View } from 'react-native';
import TeachingFields from './TeachingFields';
import Input from '../Ui/Input';
import DynamicSelect from '../Ui/DynamicSelect';
import { OnboardingData } from '../../utils/onboarding/onboardingData';
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
          <DynamicSelect
            label="COUNTRY"
            value={data.country}
            placeholder="Select country"
            name="country"
            onChange={value => update('country', value)}
            required
          />
        </View>
      </View>
      <View style={[styles.row, wide && styles.wide]}>
        <View style={[styles.field, wide && styles.half]}>
          <DynamicSelect
            label="CITY"
            value={data.city}
            placeholder="Select city"
            name="city"
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
      <Input
        label="POSTCODE"
        placeholder="M1 1AE"
        value={data.postcode}
        onChangeText={value => update('postcode', value)}
        error={requiredError(data.postcode, attempted)}
      />
      <TeachingFields
        label="Staffing needs"
        subjects={data.staffingNeeds}
        onSubjects={value => update('staffingNeeds', value)}
      />
      <DynamicSelect
        name="coverType"
        label="Cover types"
        multiple
        required
        value={data.coverTypes}
        onChange={value => update('coverTypes', value)}
      />
      <DynamicSelect
        name="region"
        label="Region"
        value={data.county}
        onChange={value => update('county', value)}
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
