import { KeyRound } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import type { TwoFactorStatus } from '../../feature/dashboard/shared/apis/twoFactorApi';
import Button from '../Ui/Button';
import SecurityCardHeader from './SecurityCardHeader';
import { securityStyles } from './securityStyles';

type Props = { status?: TwoFactorStatus; codes: string[]; busy: boolean;
  onRegenerate: () => void; onDownload: () => void };

export default function RecoveryCodesCard({ status, codes, busy, onRegenerate, onDownload }: Props) {
  return <View style={securityStyles.card}>
    <SecurityCardHeader icon={KeyRound} title="RECOVERY CODES"
      note="One-time backup codes for access when your authenticator is unavailable." />
    <View style={securityStyles.count}>
      <Text style={securityStyles.countLabel}>CODES REMAINING</Text>
      <Text style={securityStyles.countValue}>{status?.recoveryCodesRemaining || 0}</Text>
    </View>
    {codes.length ? <View style={securityStyles.codes}>
      {codes.map(code => <Text selectable key={code} style={securityStyles.code}>{code}</Text>)}
    </View> : null}
    {status?.enabled ? <Button title={busy ? 'Working...' : 'Generate new codes'}
      variant="social" disabled={busy} onPress={onRegenerate} /> : null}
    {codes.length ? <Button title="Download recovery codes" onPress={onDownload} /> : null}
  </View>;
}
