import { endpoints } from './endpoints';
import { protectedRequest } from '../utils/api/request';
import type { Invoice } from '../feature/dashboard/shared/apis/invoicesApi';

export type InvoicePaymentSession = {
  clientSecret: string;
  customerSessionClientSecret: string;
  publishableKey: string;
  amountPence: number;
  currency: string;
};

export function createInvoicePaymentSession(id: string) {
  return protectedRequest<InvoicePaymentSession>(
    endpoints.invoicePaymentSession(id),
    'POST',
  );
}

export function syncInvoice(id: string) {
  return protectedRequest<Invoice>(endpoints.invoiceSync(id), 'POST');
}
