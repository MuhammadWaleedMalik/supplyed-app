import React from 'react';
import { Text, View } from 'react-native';
import { CreditCard } from 'lucide-react-native';
import { usePayoutAccount } from '../../feature/dashboard/shared/hooks/usePayoutAccount';
import Button from '../Ui/Button';
import PayoutBalanceCard from './PayoutBalanceCard';
import RecentPayoutsCard from './RecentPayoutsCard';
import SettingsCardHeader from './SettingsCardHeader';
import { settingsStyles } from './settingsStyles';

type Props = { showBalance?: boolean };

export default function PayoutAccountCard({ showBalance = true }: Props) {
  const payouts = usePayoutAccount();
  const account = payouts.account;
  const disabled = payouts.busy || payouts.loading;
  const title = account?.ready
    ? 'Manage payouts'
    : account?.connected
    ? 'Continue payout setup'
    : 'Set up payouts';

  return (
    <View style={settingsStyles.section}>
      <View style={settingsStyles.card}>
        <SettingsCardHeader
          icon={CreditCard}
          title="STRIPE PAYOUT ACCOUNT"
          note="Set up your account to receive payments for completed bookings."
        />
        {payouts.loading ? (
          <Text style={settingsStyles.cardNote}>Loading payouts...</Text>
        ) : null}
        {account ? (
          <>
            <Text
              style={
                account.ready
                  ? settingsStyles.success
                  : settingsStyles.recordValue
              }
            >
              {account.ready
                ? 'Ready to receive payouts'
                : account.connected
                ? 'Payout setup needs attention'
                : 'Payout account not connected'}
            </Text>
            {account.requirementsDue.length ? (
              <View style={settingsStyles.record}>
                <Text style={settingsStyles.recordLabel}>REQUIRED DETAILS</Text>
                {account.requirementsDue.map(requirement => (
                  <Text key={requirement} style={settingsStyles.cardNote}>
                    • {requirement.replace(/[._]/g, ' ')}
                  </Text>
                ))}
              </View>
            ) : null}
            {account.disabledReason ? (
              <Text style={settingsStyles.error}>
                Payouts paused: {account.disabledReason.replace(/[._]/g, ' ')}
              </Text>
            ) : null}
            <Button
              title={payouts.busy ? 'Please wait...' : title}
              disabled={disabled}
              onPress={payouts.openPayouts}
            />
          </>
        ) : null}
        <Button
          title={payouts.loading ? 'Refreshing...' : 'Refresh payouts'}
          variant="social"
          disabled={disabled}
          onPress={payouts.refresh}
        />
        {payouts.notice ? (
          <Text style={settingsStyles.recordValue}>{payouts.notice}</Text>
        ) : null}
        {payouts.error ? (
          <Text style={settingsStyles.error}>{payouts.error}</Text>
        ) : null}
      </View>
      {showBalance && account?.ready && payouts.balance ? (
        <>
          <PayoutBalanceCard
            balance={payouts.balance}
            disabled={disabled}
            needsRefresh={payouts.needsRefresh}
            onWithdraw={payouts.withdraw}
            onManage={payouts.openPayouts}
          />
          <RecentPayoutsCard payouts={payouts.balance.recentPayouts} />
        </>
      ) : null}
    </View>
  );
}
