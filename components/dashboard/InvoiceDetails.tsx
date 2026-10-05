import React from 'react';
import { Text, View } from 'react-native';
import type { Invoice } from '../../feature/dashboard/shared/apis/invoicesApi';
import { formatPence } from '../../utils/payments/paymentUtils';
import { styles } from './dashboardStyles';

function dateText(value: string | null) {
  return value ? value.slice(0, 10) : 'Not set';
}

export default function InvoiceDetails({ invoice }: { invoice: Invoice }) {
  return (
    <View style={styles.section}>
      <Text style={styles.cardBody}>Teacher: {invoice.booking.instructor.name}</Text>
      <Text style={styles.cardBody}>School: {invoice.booking.institution.name}</Text>
      <Text style={styles.cardBody}>
        Work: {dateText(invoice.booking.startDate)} to {dateText(invoice.booking.endDate)}
      </Text>
      <Text style={styles.cardBody}>
        Rate: {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(invoice.rateAmount)} ({invoice.payType})
      </Text>
      {invoice.unitsWorked !== null ? (
        <Text style={styles.cardBody}>Units worked: {invoice.unitsWorked}</Text>
      ) : null}
      <Text style={styles.cardBody}>Teacher pay: {formatPence(invoice.teacherAmountPence, invoice.currency)}</Text>
      <Text style={styles.cardBody}>Fee: {formatPence(invoice.feeAmountPence, invoice.currency)}</Text>
      <Text style={styles.cardBody}>PO number: {invoice.poNumber || 'Not supplied'}</Text>
      <Text style={styles.cardBody}>Due: {dateText(invoice.dueAt)}</Text>
      {invoice.paidAt ? <Text style={styles.cardBody}>Paid: {dateText(invoice.paidAt)}</Text> : null}
      {invoice.voidedAt ? <Text style={styles.cardBody}>Voided: {dateText(invoice.voidedAt)}</Text> : null}
      <Text style={styles.cardBody}>Refunded: {formatPence(invoice.amountRefundedPence, invoice.currency)}</Text>
      {invoice.disputeStatus ? <Text style={styles.cardBody}>Dispute: {invoice.disputeStatus}</Text> : null}
      <Text style={styles.teacherMeta}>Invoice ID: {invoice.id}</Text>
      <Text style={styles.teacherMeta}>Booking ID: {invoice.booking.id}</Text>
    </View>
  );
}
