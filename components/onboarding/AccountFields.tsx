import React from 'react';
import { Text, View } from 'react-native';
import Input from '../Ui/Input';
import DynamicSelect from '../Ui/DynamicSelect';
import { createThemedStyles } from '../Ui/theme';
import {
  AccountType,
  OnboardingData,
} from '../../utils/onboarding/onboardingData';
import { requiredError } from '../../utils/onboarding/onboardingUtils';

type Props = {
  type: AccountType;
  data: OnboardingData;
  wide: boolean;
  attempted: boolean;
  phoneLocked?: boolean;
  update: (field: string, value: string | boolean) => void;
};

export default function AccountFields({
  type,
  data,
  wide,
  attempted,
  phoneLocked,
  update,
}: Props) {
  const styles = useStyles();

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
            value={data.phone}
            disabled={phoneLocked}
            onChangeText={value => update('phone', value)}
            error={requiredError(data.phone, attempted)}
          />
          <Text style={styles.hint}>
            {phoneLocked
              ? 'Your verified number is locked to protect your account.'
              : 'You can verify this number after creating your profile.'}
          </Text>
        </View>
      </View>
      {type === 'teacher' && (
        <View style={[styles.row, wide && styles.wide]}>
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
        </View>
      )}
      {type === 'teacher' ? (
        <View style={[styles.field, wide && styles.half]}>
          <Input
            label="POSTAL CODE"
            placeholder="M1 1AE"
            required
            value={data.postcode}
            onChangeText={value => update('postcode', value)}
          />
        </View>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  fields: { gap: 16 },
  row: { gap: 12 },
  wide: { flexDirection: 'row', alignItems: 'flex-start' },
  field: { width: '100%' },
  half: { flex: 1, width: 'auto' },
  phone: { width: '100%', gap: 2 },
  hint: { color: colors.muted, fontSize: 11 },
}));
