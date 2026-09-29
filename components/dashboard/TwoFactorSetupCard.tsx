import { ShieldCheck } from 'lucide-react-native';
import React from 'react';
import { Image, Text, View } from 'react-native';
import type { TwoFactorSetup, TwoFactorStatus } from '../../feature/dashboard/shared/apis/twoFactorApi';
import Button from '../Ui/Button';
import Input from '../Ui/Input';
import SecurityCardHeader from './SecurityCardHeader';
import { securityStyles } from './securityStyles';

type Props = { status?: TwoFactorStatus; setup?: TwoFactorSetup; code: string; busy: boolean;
  wide: boolean; onCode: (value: string) => void; onStart: () => void;
  onEnable: () => void; onDisable: () => void };

export default function TwoFactorSetupCard(props: Props) {
  const enabled = props.status?.enabled;
  return <View style={securityStyles.card}>
    <SecurityCardHeader icon={ShieldCheck} title="TWO-FACTOR AUTHENTICATION"
      note="Use an authenticator app for a second verification step after sign-in." />
    <View style={securityStyles.notice}><Text style={securityStyles.noticeText}>
      {enabled ? 'Two-factor authentication is enabled on this account.'
        : props.setup ? 'Scan the QR code, then enter the current code from your app.'
          : 'Two-factor authentication is not enabled yet. Start setup when ready.'}
    </Text></View>
    {!enabled && !props.setup ? <Button title={props.busy ? 'Starting...' : 'Start 2FA setup'}
      disabled={props.busy} onPress={props.onStart} /> : null}
    {props.setup ? <View style={[securityStyles.setupRow, props.wide && securityStyles.wideSetupRow]}>
      <View style={securityStyles.qrWrap}><Image source={{ uri: props.setup.qrCodeDataUrl }} style={securityStyles.qr} /></View>
      <View style={securityStyles.setupFields}>
        <Text style={securityStyles.cardTitle}>MANUAL SETUP KEY</Text>
        <Text selectable style={securityStyles.secret}>{props.setup.secret}</Text>
        <Input label="AUTHENTICATOR CODE" number value={props.code} placeholder="123456" onChangeText={props.onCode} />
        <Button title={props.busy ? 'Enabling...' : 'Enable 2FA'} disabled={props.busy} onPress={props.onEnable} />
      </View>
    </View> : null}
    {enabled ? <>
      <Input label="AUTHENTICATOR OR RECOVERY CODE" value={props.code} onChangeText={props.onCode} />
      <Button title={props.busy ? 'Working...' : 'Disable two-factor'}
        variant="social" disabled={props.busy} onPress={props.onDisable} />
    </> : null}
  </View>;
}
