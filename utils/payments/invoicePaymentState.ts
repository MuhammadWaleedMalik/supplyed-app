import type { BookingInvoice, InvoiceRole } from '../../feature/dashboard/shared/apis/invoicesApi';

// The backend checks the same conditions again against Stripe before checkout.
// A scheduled or processing automatic collection must finish on its own.
export function canPayInvoice(invoice: BookingInvoice, role: InvoiceRole) {
  return (
    role === 'INSTITUTION' &&
    (invoice.status === 'OPEN' || invoice.status === 'UNCOLLECTIBLE') &&
    (invoice.collectionMethod === 'send_invoice' ||
      (invoice.collectionMethod === 'charge_automatically' &&
        Boolean(invoice.lastPaymentFailureMessage)))
  );
}

export function isInvoicePaymentTerminal(invoice: Pick<BookingInvoice, 'status'>) {
  return invoice.status === 'PAID' || invoice.status === 'VOID';
}
