import { endpoints } from '../constants/endpoints';
import { createInvoice, getAdminInvoices, getInvoice, getMyInvoices, refundInvoice } from '../feature/dashboard/shared/apis/invoicesApi';
import { protectedRequest } from '../utils/api/request';
import { buildAdminInvoiceData, buildBookingInvoiceData, parseRefundAmount, validateInvoiceUnits, validatePoNumber } from '../utils/payments/invoiceValidation';

jest.mock('../utils/api/request', () => ({ protectedRequest: jest.fn() }));

const request = jest.mocked(protectedRequest);
const completed = { id: 'booking-1', status: 'COMPLETED', payType: 'fixed' };

beforeEach(() => request.mockReset());

describe('booking invoice validation', () => {
  it('omits worked units and all rate fields for fixed bookings', async () => {
    const data = buildBookingInvoiceData(completed, '9.50', '  PO-42  ');
    expect(data).toEqual({ bookingId: 'booking-1', poNumber: 'PO-42' });
    await createInvoice(data);
    expect(request).toHaveBeenCalledWith(endpoints.invoices, 'POST', data);
  });

  it('requires completed work and a positive daily or hourly amount', () => {
    expect(() => buildBookingInvoiceData({ ...completed, status: 'CONFIRMED' }, '', '')).toThrow('completed');
    expect(() => buildBookingInvoiceData({ ...completed, payType: 'daily' }, '', '')).toThrow();
    expect(buildBookingInvoiceData({ ...completed, payType: 'hourly' }, '4.50', '')).toEqual({ bookingId: 'booking-1', unitsWorked: 4.5 });
  });

  it.each(['0', '-1', '1.001', '10000', 'Infinity', '1e2', 'abc'])('rejects invalid units %s', value => {
    expect(validateInvoiceUnits('daily', value)).not.toBe('');
  });

  it('trims optional PO numbers and enforces the maximum length', () => {
    expect(validatePoNumber('  ' + 'x'.repeat(100) + '  ')).toBe('');
    expect(validatePoNumber('x'.repeat(101))).not.toBe('');
    expect(buildAdminInvoiceData(' booking-2 ', '', ' ')).toEqual({ bookingId: 'booking-2' });
  });

  it('converts refund pounds to integer pence without accepting extra decimals', () => {
    expect(parseRefundAmount('20.01')).toBe(2001);
    expect(parseRefundAmount('0.01')).toBe(1);
    expect(parseRefundAmount('0')).toBeNull();
    expect(parseRefundAmount('1.001')).toBeNull();
    expect(parseRefundAmount('1e2')).toBeNull();
  });
});

describe('invoice API requests', () => {
  it('reads the documented list and pagination envelope payload', async () => {
    request.mockResolvedValue({ invoices: [], pagination: { hasNextPage: true } });
    expect(await getMyInvoices(2, 'OPEN')).toEqual({ invoices: [], hasNextPage: true });
    expect(request).toHaveBeenCalledWith(endpoints.invoicesMine + '?page=2&limit=20&status=OPEN');
  });

  it('encodes admin filters and reconciles details through the backend', async () => {
    request.mockResolvedValueOnce({ invoices: [], pagination: { hasNextPage: false } });
    await getAdminInvoices(1, { status: 'PENDING', bookingId: ' book/1 ', instructorId: 'teacher-1', institutionId: 'school-1' });
    expect(request).toHaveBeenCalledWith(endpoints.invoices + '?page=1&limit=20&status=PENDING&bookingId=book%2F1&instructorId=teacher-1&institutionId=school-1');
    request.mockResolvedValueOnce({ id: 'invoice-1', status: 'PAID' });
    expect(await getInvoice('invoice-1')).toEqual({ id: 'invoice-1', status: 'PAID' });
  });

  it('supports full remaining and partial refunds without calculating a new invoice total', async () => {
    await refundInvoice('invoice-1');
    expect(request).toHaveBeenLastCalledWith(endpoints.invoices + '/invoice-1/refund', 'POST', { amountPence: undefined, reason: undefined });
    await refundInvoice('invoice-1', 2000, 'requested_by_customer');
    expect(request).toHaveBeenLastCalledWith(endpoints.invoices + '/invoice-1/refund', 'POST', { amountPence: 2000, reason: 'requested_by_customer' });
  });
});
