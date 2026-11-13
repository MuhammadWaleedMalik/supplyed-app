import React from 'react';
import { Text, View } from 'react-native';
import { History } from 'lucide-react-native';
import type { PayoutSummary } from '../../feature/dashboard/shared/apis/paymentsApi';
import { formatPence } from '../../utils/payments/paymentUtils';
import { payoutStatusLabel } from '../../utils/payments/payoutUtils';
import SettingsCardHeader from './SettingsCardHeader';
import { useSettingsStyles } from './settingsStyles';

type Props = { payouts: PayoutSummary[] };

export default function RecentPayoutsCard({ payouts }: Props) {
  const settingsStyles = useSettingsStyles();

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
            {payoutStatusLabel(payout.status)}
          </Text>
          <Text style={settingsStyles.cardNote}>
            {payout.arrivalDate &&
            Number.isFinite(Date.parse(payout.arrivalDate))
              ? (payout.status === 'paid'
                  ? 'Arrival date: '
                  : 'Expected arrival: ') +
                new Intl.DateTimeFormat('en-GB', {
                  dateStyle: 'medium',
                  timeZone: 'Europe/London',
                }).format(new Date(payout.arrivalDate))
              : 'Arrival date not available'}
          </Text>
        </View>
      ))}
      <Text style={settingsStyles.cardNote}>
        Pending and in-transit payouts have not reached your bank yet.
      </Text>
    </View>
  );
}
