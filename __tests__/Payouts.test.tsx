import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { AppState, AppStateStatus } from 'react-native';
import {
  createInstantPayout,
  createPayoutOnboardingLink,
  getPayoutAccount,
  getPayoutBalance,
  PayoutAccount,
  PayoutBalance,
} from '../feature/dashboard/shared/apis/paymentsApi';
import { usePayoutAccount } from '../feature/dashboard/shared/hooks/usePayoutAccount';
import { ApiError } from '../utils/api/request';
import { openStripeConnect } from '../utils/payments/paymentUtils';
import { readPayoutAmount } from '../utils/payments/payoutUtils';

jest.mock('../feature/dashboard/shared/apis/paymentsApi');
jest.mock('../utils/payments/paymentUtils', () => ({
  openStripeConnect: jest.fn(),
}));

const readyAccount: PayoutAccount = {
  connected: true,
  ready: true,
  detailsSubmitted: true,
  chargesEnabled: true,
  payoutsEnabled: true,
  requirementsDue: [],
  disabledReason: null,
};

const readyBalance: PayoutBalance = {
  pendingPence: 5000,
  availablePence: 2500,
  instantAvailablePence: 1000,
  instantDestination: { id: 'ba_test', label: 'Card ****1234' },
  recentPayouts: [],
};

let payouts: ReturnType<typeof usePayoutAccount>;
let renderer: TestRenderer.ReactTestRenderer;
let foreground: (state: AppStateStatus) => void;

function TestScreen() {
  payouts = usePayoutAccount();
  return null;
}

async function renderPayouts() {
  await act(async () => {
    renderer = TestRenderer.create(<TestScreen />);
  });
}

beforeEach(() => {
  jest.resetAllMocks();
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, listener) => {
      foreground = listener;
      return { remove: jest.fn() };
    });
  jest.mocked(getPayoutAccount).mockResolvedValue(readyAccount);
  jest.mocked(getPayoutBalance).mockResolvedValue(readyBalance);
  jest.mocked(createInstantPayout).mockResolvedValue({
    id: 'po_test',
    amountPence: 1000,
    method: 'instant',
    status: 'in_transit',
    arrivalDate: null,
  });
});

afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  jest.restoreAllMocks();
});

test('converts entered GBP to exact whole pence and rejects invalid precision', () => {
  expect(readPayoutAmount('')).toBeUndefined();
  expect(readPayoutAmount('0.40')).toBe(40);
  expect(readPayoutAmount('12.3')).toBe(1230);
  expect(readPayoutAmount(' 100.01 ')).toBe(10001);
  expect(() => readPayoutAmount('0.399')).toThrow();
  expect(() => readPayoutAmount('-1')).toThrow();
  expect(() => readPayoutAmount('Infinity')).toThrow();
  expect(() => readPayoutAmount('9007199254740991')).toThrow();
});

test('blocks withdrawals below 40 pence and above the available balance', async () => {
  await renderPayouts();
  await act(async () => payouts.withdraw(39));
  expect(createInstantPayout).not.toHaveBeenCalled();
  await act(async () => payouts.withdraw(1001));
  expect(createInstantPayout).not.toHaveBeenCalled();
  await act(async () => payouts.withdraw(40));
  expect(createInstantPayout).toHaveBeenCalledWith(40);
});

test('requires an eligible instant destination', async () => {
  jest.mocked(getPayoutBalance).mockResolvedValue({
    ...readyBalance,
    instantDestination: null,
  });
  await renderPayouts();
  await act(async () => payouts.withdraw());
  expect(createInstantPayout).not.toHaveBeenCalled();
});

test('keeps withdrawals blocked after an uncertain result until refresh succeeds', async () => {
  await renderPayouts();
  jest
    .mocked(createInstantPayout)
    .mockRejectedValueOnce(
      new ApiError('Request timed out.', 0, 'REQUEST_TIMEOUT'),
    );
  jest.mocked(getPayoutBalance).mockRejectedValueOnce(new Error('Offline'));
  await act(async () => payouts.withdraw());
  expect(payouts.needsRefresh).toBe(true);
  expect(getPayoutBalance).toHaveBeenCalledTimes(2);
  await act(async () => payouts.withdraw());
  expect(createInstantPayout).toHaveBeenCalledTimes(1);
  await act(async () => {
    await payouts.refresh();
  });
  expect(payouts.needsRefresh).toBe(false);
  await act(async () => payouts.withdraw(40));
  expect(createInstantPayout).toHaveBeenCalledTimes(2);
});

test('refreshes after a successful withdrawal and prevents duplicate taps', async () => {
  await renderPayouts();
  await act(async () => {
    await Promise.all([payouts.withdraw(), payouts.withdraw()]);
  });
  expect(createInstantPayout).toHaveBeenCalledTimes(1);
  expect(createInstantPayout).toHaveBeenCalledWith(undefined);
  expect(getPayoutBalance).toHaveBeenCalledTimes(2);
});

test('blocks another withdrawal when a confirmed payout cannot refresh its balance', async () => {
  await renderPayouts();
  jest.mocked(getPayoutBalance).mockRejectedValueOnce(new Error('Offline'));
  await act(async () => payouts.withdraw(40));
  expect(payouts.notice).toContain('Withdrawal requested');
  expect(payouts.needsRefresh).toBe(true);
  await act(async () => payouts.withdraw(40));
  expect(createInstantPayout).toHaveBeenCalledTimes(1);
});

test('creates a fresh onboarding link each time and reloads on app return', async () => {
  jest.mocked(getPayoutAccount).mockResolvedValue({
    ...readyAccount,
    ready: false,
    connected: false,
  });
  jest
    .mocked(createPayoutOnboardingLink)
    .mockResolvedValueOnce({
      url: 'https://connect.stripe.com/setup/one',
      expiresAt: null,
    })
    .mockResolvedValueOnce({
      url: 'https://connect.stripe.com/setup/two',
      expiresAt: null,
    });
  await renderPayouts();
  expect(getPayoutBalance).not.toHaveBeenCalled();
  await act(async () => payouts.openPayouts());
  await act(async () => payouts.openPayouts());
  expect(createPayoutOnboardingLink).toHaveBeenCalledTimes(2);
  expect(openStripeConnect).toHaveBeenLastCalledWith(
    'https://connect.stripe.com/setup/two',
  );
  jest.mocked(getPayoutAccount).mockResolvedValue(readyAccount);
  await act(async () => foreground('active'));
  expect(payouts.account?.ready).toBe(true);
  expect(getPayoutBalance).toHaveBeenCalledTimes(1);
});
