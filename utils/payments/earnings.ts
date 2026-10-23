import { londonDate } from '../jobs/londonTime';
import type { Invoice } from '../../feature/dashboard/shared/apis/invoicesApi';
export const earningsPeriods = ['All time', 'This week', 'This month', 'This year'] as const;
export type EarningsPeriod = typeof earningsPeriods[number];
export type EarningsAmount = { currency: string; paidPence: number; pendingPence: number; paidCount: number; adjustments: number; undated: number };
export type EarningsSummary = Record<EarningsPeriod, EarningsAmount[]>;
export function periodStart(period: EarningsPeriod, now = new Date()) {
  const day = londonDate(now);
  if (period === 'All time') return '';
  if (period === 'This month') return day.slice(0, 7) + '-01';
  if (period === 'This year') return day.slice(0, 4) + '-01-01';
  const date = new Date(day + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return date.toISOString().slice(0, 10);
}
/** Summaries stream every API page; the invoice list itself remains paginated.
 * Never present a partial-history sum as an all-time total. Amounts are teacher
 * shares, not school totals or Stripe payout balances. Refund allocations are
 * not exposed by this API, so these are explicitly gross invoice earnings.
 */
export async function collectEarnings(load: (page: number) => Promise<{ invoices: Invoice[]; hasNextPage: boolean; total: number }>, now = new Date()): Promise<EarningsSummary> {
  const buckets = Object.fromEntries(earningsPeriods.map(period => [period, new Map<string, EarningsAmount>()])) as Record<EarningsPeriod, Map<string, EarningsAmount>>;
  const seen = new Set<string>();
  const today = londonDate(now);
  let total: number | undefined;
  for (let page = 1; page <= 100; page++) {
    const reply = await load(page);
    if (total !== undefined && reply.total !== total) throw new Error('Invoice history changed while calculating. Refresh the summary.');
    total = reply.total;
    for (const invoice of reply.invoices) {
      if (seen.has(invoice.id)) throw new Error('Invoice history changed while calculating. Refresh the summary.');
      seen.add(invoice.id);
      if (!['PAID', 'OPEN'].includes(invoice.status)) continue;
      const rawDate = invoice.status === 'PAID' ? invoice.paidAt : invoice.createdAt;
      const date = rawDate && Number.isFinite(Date.parse(rawDate)) ? londonDate(new Date(rawDate)) : '';
      for (const period of earningsPeriods) {
        if (period !== 'All time' && (!date || date < periodStart(period, now))) continue;
        if (date && date > today) continue;
        const currency = (invoice.currency || 'GBP').toUpperCase();
        const bucket = buckets[period].get(currency) || { currency, paidPence: 0, pendingPence: 0, paidCount: 0, adjustments: 0, undated: 0 };
        if (invoice.status === 'PAID') { bucket.paidPence += invoice.teacherAmountPence; bucket.paidCount++; }
        else bucket.pendingPence += invoice.teacherAmountPence;
        if (invoice.amountRefundedPence > 0 || invoice.disputeStatus) bucket.adjustments++;
        if (!date) bucket.undated++;
        buckets[period].set(currency, bucket);
      }
    }
    if (!reply.hasNextPage) {
      if (seen.size !== total) throw new Error('The complete invoice history could not be verified. Please refresh.');
      return Object.fromEntries(earningsPeriods.map(period => [period, [...buckets[period].values()]])) as EarningsSummary;
    }
    if (!reply.invoices.length) throw new Error('The server returned an incomplete invoice history.');
  }
  throw new Error('This history requires a server-generated earnings report. No partial total is displayed.');
}
