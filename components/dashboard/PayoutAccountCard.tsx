import React from 'react';
import { Text, View } from 'react-native';
import { CreditCard } from 'lucide-react-native';
import { usePayoutAccount } from '../../feature/dashboard/shared/hooks/usePayoutAccount';
import { describePayoutRequirement } from '../../utils/payments/payoutUtils';
import Button from '../Ui/Button';
import PayoutBalanceCard from './PayoutBalanceCard';
import RecentPayoutsCard from './RecentPayoutsCard';
import SettingsCardHeader from './SettingsCardHeader';
import { useSettingsStyles } from './settingsStyles';

type Props = { showBalance?: boolean };

export default function PayoutAccountCard({ showBalance = true }: Props) {
  const settingsStyles = useSettingsStyles();

  const payouts = usePayoutAccount();
  const account = payouts.account;
  const disabled = payouts.busy || payouts.loading;
  const title = account?.ready
    ? 'Review Stripe payout details'
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
            {account.connected ? (
              <View style={settingsStyles.record}>
                <Text style={settingsStyles.cardNote}>
                  Account details:{' '}
                  {account.detailsSubmitted ? 'Submitted' : 'Required'}
                </Text>
                <Text style={settingsStyles.cardNote}>
                  Payments: {account.chargesEnabled ? 'Enabled' : 'Pending'}
                </Text>
                <Text style={settingsStyles.cardNote}>
                  Bank payouts: {account.payoutsEnabled ? 'Enabled' : 'Pending'}
                </Text>
              </View>
            ) : null}
            {account.requirementsDue.length ? (
              <View style={settingsStyles.record}>
                <Text style={settingsStyles.recordLabel}>REQUIRED DETAILS</Text>
                {[
                  ...new Set(
                    account.requirementsDue.map(describePayoutRequirement),
                  ),
                ].map(requirement => (
                  <Text key={requirement} style={settingsStyles.cardNote}>
                    {requirement}
                  </Text>
                ))}
              </View>
            ) : null}
            {account.disabledReason ? (
              <Text style={settingsStyles.error} accessibilityRole="alert">
                {account.disabledReason.includes('pending_verification')
                  ? 'Stripe is reviewing your information. This status updates when the review is complete.'
                  : 'Payouts paused: ' +
                    account.disabledReason.replace(/[._]/g, ' ')}
              </Text>
            ) : null}
            <Button
              title={payouts.busy ? 'Please wait...' : title}
              disabled={disabled}
              onPress={payouts.openPayouts}
            />
            <Text style={settingsStyles.cardNote}>
              Your bank and identity details go directly to Stripe in your
              browser. Return here to check your status. Collected invoice
              earnings and bank payouts have separate statuses.
            </Text>
            {account.ready ? (
              <>
                <Text style={settingsStyles.cardNote}>
                  For bank changes unavailable in Stripe setup, use your
                  SupplyED website account.
                </Text>
                <Button
                  title="Manage bank details on website"
                  variant="social"
                  disabled={disabled}
                  onPress={payouts.openWebsitePayouts}
                />
              </>
            ) : null}
          </>
        ) : null}
        <Button
          title={payouts.loading ? 'Refreshing...' : 'Refresh payouts'}
          variant="social"
          disabled={disabled}
          onPress={payouts.refresh}
        />
        {payouts.notice ? (
          <Text
            accessibilityLiveRegion="polite"
            style={settingsStyles.recordValue}
          >
            {payouts.notice}
          </Text>
        ) : null}
        {payouts.error ? (
          <Text accessibilityRole="alert" style={settingsStyles.error}>
            {payouts.error}
          </Text>
        ) : null}
      </View>
      {showBalance && account?.ready && payouts.balance ? (
        <>
          <PayoutBalanceCard
            balance={payouts.balance}
            disabled={disabled}
            needsRefresh={payouts.needsRefresh}
            onWithdraw={payouts.withdraw}
            onManage={payouts.openWebsitePayouts}
          />
          <RecentPayoutsCard payouts={payouts.balance.recentPayouts} />
        </>
      ) : null}
    </View>
  );
}
