import { UserRound } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { User } from '../../feature/auth/apis/authApi';
import type {
  ProfileFields,
  ProfileSnapshot,
} from '../../feature/dashboard/shared/apis/settingsApi';
import PhoneVerificationCard from '../auth/PhoneVerificationCard';
import Input from '../Ui/Input';
import ProfileImageField from './ProfileImageField';
import SettingsCardHeader from './SettingsCardHeader';
import { useSettingsStyles } from './settingsStyles';

type Props = {
  settings?: ProfileSnapshot;
  fields: ProfileFields;
  fieldErrors?: Partial<Record<keyof ProfileFields, string>>;
  imageUrl: string;
  loading: boolean;
  wide: boolean;
  onChange: (name: keyof ProfileFields, value: string | boolean) => void;
  onImage: () => void;
  onPhoneVerified: (user: User) => void;
};

export default function AccountSettingsCard(props: Props) {
  const settingsStyles = useSettingsStyles();

  return (
    <View style={settingsStyles.card}>
      <SettingsCardHeader
        icon={UserRound}
        title="ACCOUNT"
        note="Core identity stored on your SupplyED account."
      />
      <ProfileImageField
        imageUrl={props.imageUrl}
        loading={props.loading}
        onChange={props.onImage}
      />
      <View style={[settingsStyles.row, props.wide && settingsStyles.wideRow]}>
        <View style={settingsStyles.field}>
          <Input
            label="DISPLAY NAME"
            error={props.fieldErrors?.accountName}
            value={props.fields.accountName}
            onChangeText={value => props.onChange('accountName', value)}
          />
        </View>
        <View style={settingsStyles.field}>
          <Input
            label="EMAIL"
            value={props.settings?.user.email || ''}
            required={false}
            disabled
          />
        </View>
      </View>
      <Input
        label="PHONE"
        error={props.fieldErrors?.phone}
        phone
        required={false}
        value={props.fields.phone}
        disabled={
          !props.settings ||
          props.loading ||
          props.settings.user.phoneVerified === true
        }
        onChangeText={value => props.onChange('phone', value)}
      />
      <Text style={settingsStyles.cardNote}>
        {props.settings?.user.phoneVerified
          ? 'This number is verified and cannot be edited.'
          : 'Save your phone number with Save changes. Verification is optional; once verified, the number cannot be changed.'}
      </Text>
      <PhoneVerificationCard
        user={props.settings?.user}
        disabled={
          props.loading ||
          props.fields.phone !== (props.settings?.user.phone || '')
        }
        onVerified={props.onPhoneVerified}
      />
      <Text style={settingsStyles.cardNote}>
        Your verified email is used to sign in and cannot be edited here.
      </Text>
    </View>
  );
}
