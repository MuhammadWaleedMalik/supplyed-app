import React from 'react';
import { View } from 'react-native';
import type { ProfileFields } from '../../feature/dashboard/shared/apis/settingsApi';
import Input from '../Ui/Input';
import Select from '../Ui/Select';
import { settingsStyles } from './settingsStyles';

type Props = { fields: ProfileFields; wide: boolean; showBio?: boolean;
  onChange: (name: keyof ProfileFields, value: string | boolean) => void };

export default function CommonProfileFields({ fields, wide, showBio = true, onChange }: Props) {
  return <View style={settingsStyles.section}>
    <Input label="PROFILE NAME" value={fields.profileName} onChangeText={value => onChange('profileName', value)} />
    {showBio ? <Input label="BIO" multiline required={false} value={fields.bio}
      onChangeText={value => onChange('bio', value)} /> : null}
    <Input label="ADDRESS" required={false} value={fields.address} onChangeText={value => onChange('address', value)} />
    <View style={[settingsStyles.row, wide && settingsStyles.wideRow]}>
      <View style={settingsStyles.field}><Input label="CITY" value={fields.city} onChangeText={value => onChange('city', value)} /></View>
      <View style={settingsStyles.field}><Input label="COUNTY" required={false} value={fields.county} onChangeText={value => onChange('county', value)} /></View>
    </View>
    <View style={[settingsStyles.row, wide && settingsStyles.wideRow]}>
      <View style={settingsStyles.field}><Input label="POSTCODE" required={false} value={fields.postalCode}
        onChangeText={value => onChange('postalCode', value)} /></View>
      <View style={settingsStyles.field}><Select label="COUNTRY" value={fields.countryCode} placeholder="Country"
        options={['GB', 'PK', 'EG']} onChange={value => onChange('countryCode', value)} /></View>
    </View>
  </View>;
}
