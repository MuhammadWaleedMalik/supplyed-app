import React, { useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Wallet } from 'lucide-react-native';
import type { PayoutBalance } from '../../feature/dashboard/shared/apis/paymentsApi';
import { formatPence } from '../../utils/payments/paymentUtils';
import { readPayoutAmount } from '../../utils/payments/payoutUtils';
import Button from '../Ui/Button';
import Input from '../Ui/Input';
import SettingsCardHeader from './SettingsCardHeader';
import { settingsStyles } from './settingsStyles';

type Props = {
  balance: PayoutBalance;
  disabled: boolean;
  needsRefresh: boolean;
  onWithdraw: (amountPence?: number) => Promise<void>;
  onManage: () => void;
};

export default function PayoutBalanceCard(props: Props) {
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const confirmationOpen = useRef(false);
  const canWithdraw =
    props.balance.instantAvailablePence >= 40 &&
    Boolean(props.balance.instantDestination) &&
    !props.needsRefresh;

  function closeConfirmation() {
    confirmationOpen.current = false;
    setConfirming(false);
  }

  function confirmWithdrawal() {
    if (props.disabled || !canWithdraw || confirmationOpen.current) return;
    setAmountError('');
    let amountPence: number | undefined;
    try {
      amountPence = readPayoutAmount(amount);
      const requested = amountPence ?? props.balance.instantAvailablePence;
      if (requested < 40)
        throw new Error('The minimum instant withdrawal is £0.40.');
      if (requested > props.balance.instantAvailablePence) {
        throw new Error('The amount exceeds your available instant balance.');
      }
    } catch (problem) {
      setAmountError(
        problem instanceof Error ? problem.message : 'Enter a valid amount.',
      );
      return;
    }

    confirmationOpen.current = true;
    setConfirming(true);
    const requested = amountPence ?? props.balance.instantAvailablePence;
    Alert.alert(
      'Confirm instant withdrawal',
      'Withdraw ' +
        formatPence(requested) +
        ' to ' +
        props.balance.instantDestination?.label +
        '?',
      [
        { text: 'Cancel', style: 'cancel', onPress: closeConfirmation },
        {
          text: 'Withdraw',
          onPress: () => {
            closeConfirmation();
            props.onWithdraw(amountPence);
          },
        },
      ],
      { cancelable: true, onDismiss: closeConfirmation },
    );
  }

  return (
    <View style={settingsStyles.card}>
      <SettingsCardHeader
        icon={Wallet}
        title="PAYOUT BALANCE"
        note="View your earnings and withdraw an eligible balance instantly."
      />
      <View style={settingsStyles.record}>
        <Text style={settingsStyles.recordLabel}>
          AVAILABLE TO WITHDRAW NOW
        </Text>
        <Text style={settingsStyles.recordValue}>
          {formatPence(props.balance.instantAvailablePence)}
        </Text>
      </View>
      <View style={settingsStyles.record}>
        <Text style={settingsStyles.recordLabel}>PENDING</Text>
        <Text style={settingsStyles.recordValue}>
          {formatPence(props.balance.pendingPence)}
        </Text>
      </View>
      <View style={settingsStyles.record}>
        <Text style={settingsStyles.recordLabel}>
          AVAILABLE ON STRIPE STANDARD SCHEDULE
        </Text>
        <Text style={settingsStyles.recordValue}>
          {formatPence(props.balance.availablePence)}
        </Text>
      </View>
      {props.balance.instantDestination ? (
        <Text style={settingsStyles.cardNote}>
          Instant withdrawal destination:{' '}
          {props.balance.instantDestination.label}
        </Text>
      ) : (
        <>
          <Text style={settingsStyles.cardNote}>
            Add a debit card in Manage payouts to withdraw instantly.
          </Text>
          <Button
            title="Manage payouts"
            variant="social"
            disabled={props.disabled}
            onPress={props.onManage}
          />
        </>
      )}
      <Input
        label="WITHDRAWAL AMOUNT (GBP)"
        decimal
        required={false}
        placeholder="Leave blank to withdraw the full balance"
        value={amount}
        disabled={props.disabled || confirming}
        error={amountError}
        onChangeText={value => {
          setAmount(value);
          setAmountError('');
        }}
      />
      <Text style={settingsStyles.cardNote}>
        Minimum instant withdrawal: £0.40.
      </Text>
      {props.needsRefresh ? (
        <Text style={settingsStyles.error}>
          Refresh payouts to check your balance before withdrawing again.
        </Text>
      ) : null}
      <Button
        title="Withdraw instantly"
        disabled={props.disabled || confirming || !canWithdraw}
        onPress={confirmWithdrawal}
      />
    </View>
  );
}
