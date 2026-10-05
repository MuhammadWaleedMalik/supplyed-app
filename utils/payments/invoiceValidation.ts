// These forms use decimal strings so we can reject extra decimal places.
export function validateInvoiceUnits(payType: string | null | undefined, value: string) {
  const basis = (payType || '').toLowerCase();
  if (basis === 'fixed') return '';
  if (basis !== 'daily' && basis !== 'hourly') {
    return 'This booking needs a fixed, daily, or hourly pay basis before invoicing.';
  }
  const units = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(units) || !Number.isFinite(Number(units)) || Number(units) < 0.01 || Number(units) > 9999.99) {
    return 'Enter days or hours worked from 0.01 to 9999.99, with up to two decimal places.';
  }
  return '';
}

export function validatePoNumber(value: string) {
  return value.trim().length > 100 ? 'The PO number must be 100 characters or fewer.' : '';
}

export function parseRefundAmount(value: string) {
  const amount = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(amount)) return null;
  const pence = Math.round(Number(amount) * 100);
  return Number.isSafeInteger(pence) && pence >= 1 ? pence : null;
}

export function buildBookingInvoiceData(
  booking: { id: string; status: string; payType?: string | null },
  units: string,
  poNumber: string,
) {
  if (booking.status !== 'COMPLETED') throw new Error('Only completed bookings can be invoiced.');
  const error = validateInvoiceUnits(booking.payType, units) || validatePoNumber(poNumber);
  if (error) throw new Error(error);
  const data: { bookingId: string; unitsWorked?: number; poNumber?: string } = { bookingId: booking.id };
  if (booking.payType?.toLowerCase() !== 'fixed') data.unitsWorked = Number(units.trim());
  if (poNumber.trim()) data.poNumber = poNumber.trim();
  return data;
}

export function buildAdminInvoiceData(bookingId: string, units: string, poNumber: string) {
  if (!bookingId.trim()) throw new Error('Enter the completed booking ID.');
  const error = (units.trim() ? validateInvoiceUnits('daily', units) : '') || validatePoNumber(poNumber);
  if (error) throw new Error(error);
  const data: { bookingId: string; unitsWorked?: number; poNumber?: string } = { bookingId: bookingId.trim() };
  if (units.trim()) data.unitsWorked = Number(units.trim());
  if (poNumber.trim()) data.poNumber = poNumber.trim();
  return data;
}
