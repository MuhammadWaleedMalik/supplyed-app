require('./register.cjs');
const assert = require('node:assert/strict');
const test = require('node:test');
const {
  canPayInvoice,
  isInvoicePaymentTerminal,
} = require('../utils/payments/invoicePaymentState.ts');
const { parseRefundAmount } = require('../utils/payments/invoiceValidation.ts');

const invoice = overrides => ({
  status: 'OPEN',
  collectionMethod: 'send_invoice',
  lastPaymentFailureMessage: null,
  ...overrides,
});

test('only the school can pay an unpaid manual invoice', () => {
  for (const status of ['OPEN', 'UNCOLLECTIBLE']) {
    assert.equal(canPayInvoice(invoice({ status }), 'INSTITUTION'), true);
    assert.equal(canPayInvoice(invoice({ status }), 'INSTRUCTOR'), false);
    assert.equal(canPayInvoice(invoice({ status }), 'ADMIN'), false);
  }
  for (const status of ['PENDING', 'PAID', 'VOID']) {
    assert.equal(canPayInvoice(invoice({ status }), 'INSTITUTION'), false);
  }
});

test('automatic collection exposes recovery only after a server-recorded failure', () => {
  const automatic = { collectionMethod: 'charge_automatically' };
  for (const details of [
    {},
    { paymentAttemptCount: 0, nextPaymentAttemptAt: '2026-11-13T12:00:00Z' },
    { paymentAttemptCount: 1 },
    // A client interpretation of an error code cannot bypass the server flag.
    { lastPaymentFailureCode: 'authentication_required' },
  ]) {
    assert.equal(canPayInvoice(invoice({ ...automatic, ...details }), 'INSTITUTION'), false);
  }
  assert.equal(canPayInvoice(invoice({
    ...automatic,
    lastPaymentFailureMessage: 'Your card needs a security check.',
  }), 'INSTITUTION'), true);
  assert.equal(canPayInvoice(invoice({
    ...automatic,
    status: 'PAID',
    lastPaymentFailureMessage: 'An earlier attempt failed.',
  }), 'INSTITUTION'), false);
  assert.equal(canPayInvoice(invoice({ collectionMethod: undefined }), 'INSTITUTION'), false);
});

test('invoice reconciliation waits for authoritative paid or void state', () => {
  for (const status of ['OPEN', 'PENDING', 'UNCOLLECTIBLE']) {
    assert.equal(isInvoicePaymentTerminal({ status }), false);
  }
  assert.equal(isInvoicePaymentTerminal({ status: 'PAID' }), true);
  assert.equal(isInvoicePaymentTerminal({ status: 'VOID' }), true);
});

test('refund input preserves integer pence and rejects ambiguous amounts', () => {
  assert.equal(parseRefundAmount(' 19.99 '), 1999);
  assert.equal(parseRefundAmount('0.01'), 1);
  assert.equal(parseRefundAmount('12.5'), 1250);
  for (const amount of ['', '0', '-1', '1e2', '1,000', '1.001', 'NaN', 'Infinity', '9007199254740992']) {
    assert.equal(parseRefundAmount(amount), null, amount);
  }
});
