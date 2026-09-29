import { ShieldCheck } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import type { ProfileSnapshot } from '../../feature/dashboard/shared/apis/settingsApi';
import SettingsCardHeader from './SettingsCardHeader';
import { settingsStyles } from './settingsStyles';

type Props = { settings?: ProfileSnapshot };

function Record({ label, value }: { label: string; value: string }) {
  return <View style={settingsStyles.record}>
    <Text style={settingsStyles.recordLabel}>{label}</Text>
    <Text style={settingsStyles.recordValue}>{value}</Text>
  </View>;
}

export default function SettingsStatusCard({ settings }: Props) {
  const user = settings?.user;
  const profile = settings?.profile || {};
  return (
    <View style={settingsStyles.card}>
      <SettingsCardHeader icon={ShieldCheck} title="ACCOUNT STATUS" note="Verification and security summary." />
      <Record label="ROLE" value={user?.role || 'Loading'} />
      <Record label="EMAIL" value={user?.emailVerified ? 'Verified' : 'Not verified'} />
      <Record label="PHONE" value={user?.phoneVerified ? 'Verified' : 'Not verified'} />
      <Record label="TWO-FACTOR" value={user?.twoFactorEnabled ? 'Enabled' : 'Disabled'} />
      <Record label="PROFILE" value={String(profile.status || 'INCOMPLETE')} />
      <Record label="LAST LOGIN" value={user?.lastLogin?.slice(0, 10) || 'Not available'} />
    </View>
  );
}
