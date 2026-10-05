import React from 'react';
import { Text, View } from 'react-native';
import { History } from 'lucide-react-native';
import type { PayoutSummary } from '../../feature/dashboard/shared/apis/paymentsApi';
import { formatPence } from '../../utils/payments/paymentUtils';
import SettingsCardHeader from './SettingsCardHeader';
import { settingsStyles } from './settingsStyles';

type Props = { payouts: PayoutSummary[] };

export default function RecentPayoutsCard({ payouts }: Props) {
  return (
    <View style={settingsStyles.card}>
      <SettingsCardHeader
        icon={History}
        title="RECENT PAYOUTS"
        note="Payout status and arrival dates are confirmed by Stripe."
      />
      {!payouts.length ? (
        <Text style={settingsStyles.cardNote}>No payouts yet.</Text>
      ) : null}
      {payouts.map(payout => (
        <View key={payout.id} style={settingsStyles.record}>
          <Text style={settingsStyles.recordValue}>
            {formatPence(payout.amountPence)}
          </Text>
          <Text style={settingsStyles.cardNote}>
            {payout.method.replace(/_/g, ' ')} ·{' '}
            {payout.status.replace(/_/g, ' ')}
          </Text>
          <Text style={settingsStyles.cardNote}>
            {payout.arrivalDate
              ? 'Expected arrival: ' + payout.arrivalDate.slice(0, 10)
              : 'Arrival date not available'}
          </Text>
        </View>
      ))}
    </View>
  );
}
