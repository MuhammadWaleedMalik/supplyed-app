import React from 'react';
import { View } from 'react-native';
import type { ProfileFields } from '../../feature/dashboard/shared/apis/settingsApi';
import Input from '../Ui/Input';
import DynamicSelect from '../Ui/DynamicSelect';
import { useSettingsStyles } from './settingsStyles';

type Props = {
  fields: ProfileFields;
  fieldErrors?: Partial<Record<keyof ProfileFields, string>>;
  wide: boolean;
  showBio?: boolean;
  onChange: (name: keyof ProfileFields, value: string | boolean) => void;
};

export default function CommonProfileFields({
  fields,
  fieldErrors,
  wide,
  showBio = true,
  onChange,
}: Props) {
  const settingsStyles = useSettingsStyles();

  return (
    <View style={settingsStyles.section}>
      <Input
        label="PROFILE NAME"
        error={fieldErrors?.profileName}
        value={fields.profileName}
        onChangeText={value => onChange('profileName', value)}
      />
      {showBio ? (
        <Input
          label="BIO"
          multiline
          required={false}
          value={fields.bio}
          onChangeText={value => onChange('bio', value)}
        />
      ) : null}
      <Input
        label="ADDRESS"
        required={false}
        value={fields.address}
        onChangeText={value => onChange('address', value)}
      />
      <View style={[settingsStyles.row, wide && settingsStyles.wideRow]}>
        <View style={settingsStyles.field}>
          <DynamicSelect
            name="city"
            label="CITY"
            value={fields.city}
            onChange={value => onChange('city', value)}
          />
        </View>
        <View style={settingsStyles.field}>
          <DynamicSelect
            name="region"
            label="COUNTY"
            required={false}
            value={fields.county}
            onChange={value => onChange('county', value)}
          />
        </View>
      </View>
      <View style={[settingsStyles.row, wide && settingsStyles.wideRow]}>
        <View style={settingsStyles.field}>
          <Input
            label="POSTCODE"
            required={false}
            value={fields.postalCode}
            onChangeText={value => onChange('postalCode', value)}
          />
        </View>
        <View style={settingsStyles.field}>
          <DynamicSelect
            label="COUNTRY"
            value={fields.countryCode}
            placeholder="Country"
            name="country"
            onChange={value => onChange('countryCode', value)}
          />
        </View>
      </View>
    </View>
  );
}
