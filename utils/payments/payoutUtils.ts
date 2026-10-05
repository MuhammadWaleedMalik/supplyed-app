import { ApiError } from '../api/request';

// Keep pounds as text until converting to whole pence, without rounding floats.
export function readPayoutAmount(value: string) {
  const text = value.trim();
  if (!text) return undefined;
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    throw new Error('Enter an amount in pounds with up to two decimal places.');
  }
  const [pounds, fraction = ''] = text.split('.');
  const pence = Number(pounds) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(pence)) {
    throw new Error('Enter a valid withdrawal amount.');
  }
  return pence;
}

export function payoutResultIsUncertain(problem: unknown) {
  if (!(problem instanceof ApiError)) return true;
  return (
    problem.status === 0 || problem.status === 408 || problem.status >= 500
  );
}
