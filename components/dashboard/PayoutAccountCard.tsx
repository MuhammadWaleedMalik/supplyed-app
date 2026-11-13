import React from 'react';
import { Text, View } from 'react-native';
import {
  CircleAlert,
  CircleCheck,
  Clock3,
  CreditCard,
} from 'lucide-react-native';
import { usePayoutAccount } from '../../feature/dashboard/shared/hooks/usePayoutAccount';
import { describePayoutRequirement } from '../../utils/payments/payoutUtils';
import Button from '../Ui/Button';
import PayoutBalanceCard from './PayoutBalanceCard';
import RecentPayoutsCard from './RecentPayoutsCard';
import SettingsCardHeader from './SettingsCardHeader';
import StripeCheckoutModal from '../payments/StripeCheckoutModal';
import { useSettingsStyles } from './settingsStyles';

type Props = { showBalance?: boolean };

type PayoutStatusRowProps = {
  title: string;
  description: string;
  state: 'ready' | 'pending' | 'required';
  label: string;
};

function PayoutStatusRow({
  title,
  description,
  state,
  label,
}: PayoutStatusRowProps) {
  const styles = useSettingsStyles();
  const Icon =
    state === 'ready'
      ? CircleCheck
      : state === 'required'
      ? CircleAlert
      : Clock3;
  const iconColor =
    state === 'ready' ? '#17783b' : state === 'required' ? '#b4233f' : '#9a6700';

  return (
    <View style={styles.payoutStatusRow}>
      <View
        style={[
          styles.payoutStatusIcon,
          state === 'ready'
            ? styles.payoutStatusIconReady
            : state === 'required'
            ? styles.payoutStatusIconRequired
            : styles.payoutStatusIconPending,
        ]}
      >
        <Icon size={19} color={iconColor} />
      </View>
      <View style={styles.payoutStatusCopy}>
        <Text style={styles.payoutStatusTitle}>{title}</Text>
        <Text style={styles.payoutStatusDescription}>{description}</Text>
      </View>
      <View
        style={[
          styles.payoutStatusBadge,
          state === 'ready'
            ? styles.payoutStatusBadgeReady
            : state === 'required'
            ? styles.payoutStatusBadgeRequired
            : styles.payoutStatusBadgePending,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.payoutStatusBadgeText,
            state === 'ready'
              ? styles.payoutStatusBadgeTextReady
              : state === 'required'
              ? styles.payoutStatusBadgeTextRequired
              : styles.payoutStatusBadgeTextPending,
          ]}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

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
      <StripeCheckoutModal
        visible={Boolean(payouts.payoutUrl)}
        url={payouts.payoutUrl || 'about:blank'}
        eyebrow="SECURE STRIPE PAYOUTS"
        title="Set up teacher payouts"
        securityMessage="Identity and bank details go directly to Stripe"
        returnPaths={['/payouts/return', '/payouts/refresh']}
        onClose={result => {
          payouts.closePayouts(result).catch(() => {});
        }}
      />
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
            <View
              style={[
                settingsStyles.payoutSummary,
                account.ready
                  ? settingsStyles.payoutSummaryReady
                  : account.requirementsDue.length
                  ? settingsStyles.payoutSummaryRequired
                  : settingsStyles.payoutSummaryPending,
              ]}
            >
              <Text style={settingsStyles.payoutSummaryEyebrow}>
                STRIPE ACCOUNT STATUS
              </Text>
              <Text style={settingsStyles.payoutSummaryTitle}>
                {account.ready
                  ? 'Ready to receive payouts'
                  : account.requirementsDue.length
                  ? 'More information is needed'
                  : account.connected
                  ? 'Stripe verification in progress'
                  : 'Connect your payout account'}
              </Text>
              <Text style={settingsStyles.payoutSummaryText}>
                {account.ready
                  ? 'Your account can accept payments and send funds to your bank.'
                  : account.requirementsDue.length
                  ? 'Open Stripe to provide the remaining details and continue verification.'
                  : account.connected
                  ? 'Your details were received. Stripe will activate each service after its checks finish.'
                  : 'Complete the secure Stripe form to receive earnings.'}
              </Text>
            </View>
            {account.connected ? (
              <View style={settingsStyles.payoutStatusList}>
                <PayoutStatusRow
                  title="Account details"
                  description={
                    account.detailsSubmitted
                      ? 'Your information has been sent securely to Stripe.'
                      : 'Complete your identity and account information.'
                  }
                  state={account.detailsSubmitted ? 'ready' : 'required'}
                  label={account.detailsSubmitted ? 'Complete' : 'Required'}
                />
                <PayoutStatusRow
                  title="Payments"
                  description={
                    account.chargesEnabled
                      ? 'Your Stripe account is enabled for payments.'
                      : 'Stripe will enable payments after verification.'
                  }
                  state={account.chargesEnabled ? 'ready' : 'pending'}
                  label={account.chargesEnabled ? 'Active' : 'Pending'}
                />
                <PayoutStatusRow
                  title="Bank payouts"
                  description={
                    account.payoutsEnabled
                      ? 'Earnings can be transferred to your bank.'
                      : 'Bank transfers will activate after Stripe approval.'
                  }
                  state={account.payoutsEnabled ? 'ready' : 'pending'}
                  label={account.payoutsEnabled ? 'Active' : 'Pending'}
                />
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
              Your bank and identity details go directly to Stripe inside this
              app. Return here to check your status. Collected invoice
              earnings and bank payouts have separate statuses.
            </Text>
            {account.ready ? (
              <>
                <Text style={settingsStyles.cardNote}>
                  Review or update your payout details securely with Stripe.
                </Text>
                <Button
                  title="Manage payout details"
                  variant="social"
                  disabled={disabled}
                  onPress={payouts.openPayouts}
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
            onManage={payouts.openPayouts}
          />
          <RecentPayoutsCard payouts={payouts.balance.recentPayouts} />
        </>
      ) : null}
    </View>
  );
}
