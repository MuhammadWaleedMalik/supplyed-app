import React from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import Button from '../components/Ui/Button';
import InvoiceCard from '../components/dashboard/InvoiceCard';
import { getInvoice, Invoice, refundInvoice } from '../feature/dashboard/shared/apis/invoicesApi';
import { openStripeInvoice } from '../utils/payments/paymentUtils';

jest.mock('../feature/dashboard/shared/apis/invoicesApi', () => ({
  getInvoice: jest.fn(),
  refundInvoice: jest.fn(),
  resendInvoice: jest.fn(),
  voidInvoice: jest.fn(),
}));
jest.mock('../utils/payments/paymentUtils', () => ({
  formatPence: (value: number) => '£' + (value / 100).toFixed(2),
  openStripeInvoice: jest.fn(),
  openInvoicePdf: jest.fn(),
}));

const invoice: Invoice = {
  id: 'invoice-1', status: 'OPEN', totalAmountPence: 12000,
  hostedInvoiceUrl: 'https://invoice.stripe.com/i/test', dueAt: null, paidAt: null,
  booking: { id: 'booking-1', jobTitle: 'Maths cover', startDate: null, endDate: null, instructor: { id: 'teacher-1', name: 'Teacher' }, institution: { id: 'school-1', name: 'School' } },
  payType: 'fixed', rateAmount: 100, unitsWorked: null, teacherAmountPence: 10000,
  feeAmountPence: 2000, currency: 'gbp', poNumber: null, invoiceNumber: 'INV-1',
  invoicePdfUrl: null, voidedAt: null, amountRefundedPence: 0, disputeStatus: null,
  createdAt: null, updatedAt: null,
};

let screen: renderer.ReactTestRenderer;
let onStateChange: (state: AppStateStatus) => void;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
    onStateChange = listener;
    return { remove: jest.fn() };
  });
});
afterEach(async () => {
  if (screen) await act(async () => screen.unmount());
  jest.restoreAllMocks();
});

async function press(title: string) {
  await act(async () => {
    screen.root.findAllByType(Button).find(button => button.props.title === title)?.props.onPress();
  });
}

it('keeps an invoice open until the backend confirms payment after returning from Stripe', async () => {
  jest.mocked(getInvoice).mockResolvedValueOnce(invoice).mockResolvedValueOnce(invoice).mockResolvedValueOnce({ ...invoice, status: 'PAID', paidAt: '2026-10-05T12:00:00Z' });
  await act(async () => { screen = renderer.create(<InvoiceCard invoice={invoice} role="INSTITUTION" />); });
  await press('Pay invoice');
  expect(openStripeInvoice).toHaveBeenCalledWith(invoice.hostedInvoiceUrl);
  expect(screen.root.findAllByType(Button).some(button => button.props.title === 'Pay invoice')).toBe(true);
  await act(async () => { onStateChange('active'); });
  expect(getInvoice).toHaveBeenCalledTimes(2);
  expect(screen.root.findAllByType(Button).some(button => button.props.title === 'Pay invoice')).toBe(true);
  await act(async () => { onStateChange('active'); });
  expect(getInvoice).toHaveBeenCalledTimes(3);
  expect(getInvoice).toHaveBeenLastCalledWith(invoice.id);
  expect(screen.root.findAllByType(Button).some(button => button.props.title === 'Pay invoice')).toBe(false);
});

it('requires reconciliation before retrying a refund with an uncertain result', async () => {
  const paid = { ...invoice, status: 'PAID' as const };
  jest.mocked(refundInvoice).mockRejectedValueOnce(new Error('Request timed out.'));
  jest.mocked(getInvoice).mockResolvedValue(paid);
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    buttons?.find(button => button.text === 'Refund')?.onPress?.();
  });
  await act(async () => { screen = renderer.create(<InvoiceCard invoice={paid} role="ADMIN" />); });
  await press('Refund invoice');
  await press('Confirm refund');
  expect(refundInvoice).toHaveBeenCalledTimes(1);
  expect(getInvoice).toHaveBeenCalledWith(paid.id);
  expect(screen.root.findAllByType(Button).find(button => button.props.title === 'Confirm refund')?.props.disabled).toBe(true);
  await press('Refresh payment');
  expect(screen.root.findAllByType(Button).find(button => button.props.title === 'Confirm refund')?.props.disabled).toBe(false);
});
