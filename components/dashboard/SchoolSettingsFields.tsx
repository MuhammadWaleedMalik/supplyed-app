import React from 'react';
import { View } from 'react-native';
import type { ProfileFields } from '../../feature/dashboard/shared/apis/settingsApi';
import { institutionTypes } from '../../utils/onboarding/onboardingData';
import Input from '../Ui/Input';
import Select from '../Ui/Select';
import ChoiceField from './ChoiceField';
import { settingsStyles } from './settingsStyles';

type Props = { fields: ProfileFields; wide: boolean;
  onChange: (name: keyof ProfileFields, value: string | boolean) => void };

export default function SchoolSettingsFields({ fields, wide, onChange }: Props) {
  const isMat = fields.institutionType === 'MAT school';

  return <View style={settingsStyles.section}>
    <View style={[settingsStyles.row, wide && settingsStyles.wideRow]}>
      <View style={settingsStyles.field}><Input label="REGISTRATION ID" required={false}
        value={fields.registrationId} onChangeText={value => onChange('registrationId', value)} /></View>
      <View style={settingsStyles.field}><Input label="DOMAIN" value={fields.domain}
        onChangeText={value => onChange('domain', value)} /></View>
    </View>
    <Select label="SCHOOL TYPE" value={fields.institutionType} placeholder="School type"
      options={institutionTypes} onChange={value => onChange('institutionType', value)} />
    {isMat ? <View style={[settingsStyles.row, wide && settingsStyles.wideRow]}>
      <View style={settingsStyles.field}><Input label="TRUST NAME" value={fields.trustName}
        onChangeText={value => onChange('trustName', value)} /></View>
      <View style={settingsStyles.field}><Input label="TRUST COMPANY NUMBER" required={false}
        value={fields.trustCompanyNumber} onChangeText={value => onChange('trustCompanyNumber', value)} /></View>
    </View> : null}
    <View style={[settingsStyles.row, wide && settingsStyles.wideRow]}>
      <View style={settingsStyles.field}><Input label="YOUR ROLE" required={false} value={fields.userRole}
        onChangeText={value => onChange('userRole', value)} /></View>
      <View style={settingsStyles.field}><Input label="TYPICAL PUPIL COUNT" number required={false}
        value={fields.typicalPupilCount} onChangeText={value => onChange('typicalPupilCount', value)} /></View>
    </View>
    <Input label="STAFFING NEEDS" required={false} multiline value={fields.staffingNeeds}
      onChangeText={value => onChange('staffingNeeds', value)} />
    <Input label="COVER TYPES" required={false} value={fields.coverTypes}
      placeholder="Same-day cover, Long-term roles" onChangeText={value => onChange('coverTypes', value)} />
    <View style={[settingsStyles.row, wide && settingsStyles.wideRow]}>
      <View style={settingsStyles.field}><Input label="COMPLIANCE CONTACT" required={false}
        value={fields.complianceContact} onChangeText={value => onChange('complianceContact', value)} /></View>
      <View style={settingsStyles.field}><Input label="COMPLIANCE EMAIL" email required={false}
        value={fields.complianceEmail} onChangeText={value => onChange('complianceEmail', value)} /></View>
    </View>
    <ChoiceField label="Safeguarding responsibility confirmed"
      value={fields.safeguardingConfirmed ? 'yes' : 'no'} options={['yes', 'no']}
      onChange={value => onChange('safeguardingConfirmed', value === 'yes')} />
  </View>;
}
