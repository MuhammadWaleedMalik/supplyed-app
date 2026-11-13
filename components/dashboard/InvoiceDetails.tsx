import { plannedLabel } from '../../utils/jobs/workSchedule';
import React from 'react';
import { Text, View } from 'react-native';
import type { Invoice } from '../../feature/dashboard/shared/apis/invoicesApi';
import { formatPence } from '../../utils/payments/paymentUtils';
import { useStyles } from './dashboardStyles';

function dateText(value: string | null) {
  return value ? value.slice(0, 10) : 'Not set';
}

export default function InvoiceDetails({ invoice }: { invoice: Invoice }) {
  const styles = useStyles();

  return (
    <View style={styles.section}>
      <Text style={styles.cardBody}>
        Teacher: {invoice.booking.instructor.name}
      </Text>
      <Text style={styles.cardBody}>
        School: {invoice.booking.institution.name}
      </Text>
      <Text style={styles.cardBody}>
        Work: {dateText(invoice.booking.startDate)} to{' '}
        {dateText(invoice.booking.endDate)}
      </Text>
      <Text style={styles.cardBody}>
        Rate:{' '}
        {new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: 'GBP',
        }).format(invoice.rateAmount)}{' '}
        ({invoice.payType})
      </Text>
      <Text style={styles.cardBody}>
        {plannedLabel(invoice.booking)} (agreed plan)
      </Text>
      {invoice.unitsWorked !== null ? (
        <Text style={styles.cardBody}>
          Actual units worked: {invoice.unitsWorked}
        </Text>
      ) : null}
      <Text style={styles.cardBody}>
        Teacher pay: {formatPence(invoice.teacherAmountPence, invoice.currency)}
      </Text>
      <Text style={styles.cardBody}>
        Fee: {formatPence(invoice.feeAmountPence, invoice.currency)}
      </Text>
      <Text style={styles.cardBody}>
        Total: {formatPence(invoice.totalAmountPence, invoice.currency)}
      </Text>
      <Text style={styles.cardBody}>
        PO number: {invoice.poNumber || 'Not supplied'}
      </Text>
      <Text style={styles.cardBody}>Due: {dateText(invoice.dueAt)}</Text>
      <Text style={styles.cardBody}>
        Collection:{' '}
        {invoice.collectionMethod === 'charge_automatically'
          ? 'Automatic card payment'
          : 'Manual invoice'}
      </Text>
      {invoice.billingPeriodLabel ? (
        <Text style={styles.cardBody}>
          Billing period: {invoice.billingPeriodLabel}
        </Text>
      ) : null}
      {invoice.lastPaymentFailureMessage ? (
        <Text style={styles.cardBody}>
          Payment problem: {invoice.lastPaymentFailureMessage}
        </Text>
      ) : null}
      {invoice.collectionMethod === 'charge_automatically' ? (
        <Text style={styles.cardBody}>
          Payment attempts: {invoice.paymentAttemptCount ?? 0}
        </Text>
      ) : null}
      {invoice.nextPaymentAttemptAt ? (
        <Text style={styles.cardBody}>
          Next attempt: {new Date(invoice.nextPaymentAttemptAt).toLocaleString('en-GB', { timeZone: 'Europe/London' })} (London time)
        </Text>
      ) : null}
      {invoice.paidAt ? (
        <Text style={styles.cardBody}>Paid: {dateText(invoice.paidAt)}</Text>
      ) : null}
      {invoice.voidedAt ? (
        <Text style={styles.cardBody}>
          Voided: {dateText(invoice.voidedAt)}
        </Text>
      ) : null}
      <Text style={styles.cardBody}>
        Refunded: {formatPence(invoice.amountRefundedPence, invoice.currency)}
      </Text>
      {invoice.disputeStatus ? (
        <Text style={styles.cardBody}>Dispute: {invoice.disputeStatus}</Text>
      ) : null}
      <Text style={styles.teacherMeta}>Invoice ID: {invoice.id}</Text>
      <Text style={styles.teacherMeta}>Booking ID: {invoice.booking.id}</Text>
    </View>
  );
}
