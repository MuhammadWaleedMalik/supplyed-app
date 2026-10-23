import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useAppSelector } from '../../store/hooks';
import { getMyInvoices } from '../../feature/dashboard/shared/apis/invoicesApi';
import { getSessionVersion } from '../../utils/api/session';
import {
  collectEarnings,
  earningsPeriods,
  EarningsPeriod,
  EarningsSummary,
} from '../../utils/payments/earnings';
import { createThemedStyles } from '../Ui/theme';
import { InfoGrid, RecordSkeleton } from '../Ui/RecordLayout';
import Select from '../Ui/Select';
import Button from '../Ui/Button';
export default function EarningsSummaryCard() {
  const styles = useStyles();
  const [period, setPeriod] = useState<EarningsPeriod>('All time');
  const [summary, setSummary] = useState<EarningsSummary>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const revision = useAppSelector(
    state => state.dashboardNavigation.dataRevision,
  );
  useEffect(() => {
    let active = true;
    const version = getSessionVersion();
    setLoading(true);
    setError('');
    setSummary(undefined);
    collectEarnings(async page => {
      if (!active || version !== getSessionVersion())
        throw new Error('Calculation cancelled.');
      return getMyInvoices(page, 'ALL', 100);
    })
      .then(result => {
        if (active && version === getSessionVersion()) setSummary(result);
      })
      .catch(problem => {
        if (active)
          setError(problem.message || 'Unable to calculate earnings.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt, revision]);
  const amounts = summary?.[period] || [];
  const money = (pence: number, currency: string) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(
      pence / 100,
    );
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>YOUR EARNINGS</Text>
      <Text style={styles.title}>Paid invoice earnings</Text>
      <Select
        label="Period"
        value={period}
        onChange={value => setPeriod((value || 'All time') as EarningsPeriod)}
        placeholder="All time"
        options={[...earningsPeriods]}
      />
      {loading ? (
        <RecordSkeleton />
      ) : error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : (
        <>
          {!amounts.length ? (
            <Text style={styles.amount}>£0.00</Text>
          ) : (
            amounts.map(amount => (
              <View key={amount.currency} style={styles.group}>
                <Text style={styles.amount}>
                  {money(amount.paidPence, amount.currency)}
                </Text>
                <InfoGrid
                  items={[
                    { label: 'Paid invoices', value: String(amount.paidCount) },
                    {
                      label: 'Awaiting payment',
                      value: money(amount.pendingPence, amount.currency),
                    },
                  ]}
                />
                {amount.adjustments ? (
                  <Text style={styles.note}>
                    {amount.adjustments} invoice(s) have refunds or disputes.
                    Check their details for adjustments.
                  </Text>
                ) : null}
                {amount.undated ? (
                  <Text style={styles.note}>
                    Some payment dates are unavailable; those invoices only
                    count in All time.
                  </Text>
                ) : null}
              </View>
            ))
          )}
          <Text style={styles.note}>
            Your teacher share, before refunds or disputes—not your bank payout
            balance. Paid totals use the payment date; pending totals use the
            invoice date. Weeks start Monday, in UK time.
          </Text>
        </>
      )}
      <Button
        title="Refresh earnings"
        variant="link"
        loading={loading}
        onPress={() => setAttempt(value => value + 1)}
      />
    </View>
  );
}
const useStyles = createThemedStyles(colors => ({
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    gap: 14,
  },
  eyebrow: {
    color: colors.brandDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink },
  amount: {
    fontSize: 36,
    lineHeight: 46,
    fontWeight: '800',
    letterSpacing: -1,
    color: colors.brandDark,
  },
  group: { gap: 14 },
  note: { fontSize: 12, lineHeight: 20, color: colors.muted },
  error: { color: '#b42318', lineHeight: 22 },
}));
