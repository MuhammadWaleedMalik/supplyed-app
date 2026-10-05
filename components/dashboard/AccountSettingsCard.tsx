import { UserRound } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { User } from '../../feature/auth/apis/authApi';
import type { ProfileFields, ProfileSnapshot } from '../../feature/dashboard/shared/apis/settingsApi';
import PhoneVerificationCard from '../auth/PhoneVerificationCard';
import Input from '../Ui/Input';
import ProfileImageField from './ProfileImageField';
import SettingsCardHeader from './SettingsCardHeader';
import { settingsStyles } from './settingsStyles';

type Props = { settings?: ProfileSnapshot; fields: ProfileFields; imageUrl: string; loading: boolean;
  wide: boolean; onChange: (name: keyof ProfileFields, value: string | boolean) => void;
  onImage: () => void; onPhoneVerified: (user: User) => void };

export default function AccountSettingsCard(props: Props) {
  return (
    <View style={settingsStyles.card}>
      <SettingsCardHeader icon={UserRound} title="ACCOUNT"
        note="Core identity stored on your SupplyED account." />
      <ProfileImageField imageUrl={props.imageUrl} loading={props.loading} onChange={props.onImage} />
      <View style={[settingsStyles.row, props.wide && settingsStyles.wideRow]}>
        <View style={settingsStyles.field}><Input label="DISPLAY NAME" value={props.fields.accountName}
          onChangeText={value => props.onChange('accountName', value)} /></View>
        <View style={settingsStyles.field}><Input label="EMAIL" value={props.settings?.user.email || ''}
          required={false} disabled /></View>
      </View>
      <PhoneVerificationCard user={props.settings?.user} editable
        disabled={props.loading} onVerified={props.onPhoneVerified} />
      <Text style={settingsStyles.cardNote}>Email changes are not supported by the current API.</Text>
    </View>
  );
}
