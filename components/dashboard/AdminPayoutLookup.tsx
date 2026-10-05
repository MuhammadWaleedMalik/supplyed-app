import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Search } from 'lucide-react-native';
import {
  getInstructorPayoutAccount,
  PayoutAccount,
} from '../../feature/dashboard/shared/apis/paymentsApi';
import Button from '../Ui/Button';
import Input from '../Ui/Input';
import SettingsCardHeader from './SettingsCardHeader';
import { settingsStyles } from './settingsStyles';

export default function AdminPayoutLookup() {
  const [instructorId, setInstructorId] = useState('');
  const [account, setAccount] = useState<PayoutAccount>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestRunning = useRef(false);

  async function lookup() {
    if (requestRunning.current || !instructorId.trim()) return;
    requestRunning.current = true;
    setLoading(true);
    setError('');
    setAccount(undefined);
    try {
      setAccount(await getInstructorPayoutAccount(instructorId));
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : 'Unable to look up payout account.',
      );
    } finally {
      requestRunning.current = false;
      setLoading(false);
    }
  }

  return (
    <View style={settingsStyles.card}>
      <SettingsCardHeader
        icon={Search}
        title="INSTRUCTOR PAYOUT LOOKUP"
        note="Check whether a teacher can receive invoice payments."
      />
      <Input
        label="INSTRUCTOR ID"
        placeholder="Enter the instructor profile ID"
        value={instructorId}
        disabled={loading}
        onChangeText={value => {
          setInstructorId(value);
          setAccount(undefined);
          setError('');
        }}
      />
      <Button
        title={loading ? 'Checking...' : 'Check payout account'}
        disabled={loading || !instructorId.trim()}
        onPress={lookup}
      />
      {account ? (
        <View style={settingsStyles.record}>
          <Text
            style={
              account.ready
                ? settingsStyles.success
                : settingsStyles.recordValue
            }
          >
            {account.ready
              ? 'Ready to receive payouts'
              : 'Not ready to receive payouts'}
          </Text>
          <Text style={settingsStyles.cardNote}>
            Connected: {account.connected ? 'Yes' : 'No'}
          </Text>
          <Text style={settingsStyles.cardNote}>
            Details submitted: {account.detailsSubmitted ? 'Yes' : 'No'}
          </Text>
          <Text style={settingsStyles.cardNote}>
            Charges enabled: {account.chargesEnabled ? 'Yes' : 'No'}
          </Text>
          <Text style={settingsStyles.cardNote}>
            Payouts enabled: {account.payoutsEnabled ? 'Yes' : 'No'}
          </Text>
          {account.requirementsDue.map(requirement => (
            <Text key={requirement} style={settingsStyles.cardNote}>
              Required: {requirement.replace(/[._]/g, ' ')}
            </Text>
          ))}
          {account.disabledReason ? (
            <Text style={settingsStyles.error}>
              Payouts paused: {account.disabledReason.replace(/[._]/g, ' ')}
            </Text>
          ) : null}
        </View>
      ) : null}
      {error ? <Text style={settingsStyles.error}>{error}</Text> : null}
    </View>
  );
}
