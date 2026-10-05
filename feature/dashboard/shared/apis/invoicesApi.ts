import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';

export type InvoiceRole = 'INSTRUCTOR' | 'INSTITUTION' | 'ADMIN';
export type InvoiceStatus = 'PENDING' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE';
export type RefundReason = 'duplicate' | 'fraudulent' | 'requested_by_customer';

export type BookingInvoice = {
  id: string;
  status: InvoiceStatus;
  totalAmountPence: number;
  hostedInvoiceUrl: string | null;
  dueAt: string | null;
  paidAt: string | null;
};

export type Invoice = BookingInvoice & {
  booking: {
    id: string;
    jobTitle: string;
    startDate: string | null;
    endDate: string | null;
    instructor: { id: string; name: string };
    institution: { id: string; name: string };
  };
  payType: string;
  rateAmount: number;
  unitsWorked: number | null;
  teacherAmountPence: number;
  feeAmountPence: number;
  currency: string;
  poNumber: string | null;
  invoiceNumber: string | null;
  invoicePdfUrl: string | null;
  voidedAt: string | null;
  amountRefundedPence: number;
  disputeStatus: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type InvoiceFilters = {
  status?: string;
  bookingId?: string;
  instructorId?: string;
  institutionId?: string;
};

type InvoicePageReply = {
  invoices: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
};

export type InvoicePage = { invoices: Invoice[]; hasNextPage: boolean };

function listPath(path: string, page: number, filters: InvoiceFilters) {
  let query = '?page=' + page + '&limit=20';
  if (filters.status && filters.status !== 'ALL') {
    query += '&status=' + encodeURIComponent(filters.status);
  }
  if (filters.bookingId?.trim()) {
    query += '&bookingId=' + encodeURIComponent(filters.bookingId.trim());
  }
  if (filters.instructorId?.trim()) {
    query += '&instructorId=' + encodeURIComponent(filters.instructorId.trim());
  }
  if (filters.institutionId?.trim()) {
    query += '&institutionId=' + encodeURIComponent(filters.institutionId.trim());
  }
  return path + query;
}

export async function getMyInvoices(page = 1, status = 'ALL') {
  const reply = await protectedRequest<InvoicePageReply>(
    listPath(endpoints.invoicesMine, page, { status }),
  );
  return { invoices: reply.invoices, hasNextPage: reply.pagination.hasNextPage };
}

export async function getAdminInvoices(page = 1, filters: InvoiceFilters = {}) {
  const reply = await protectedRequest<InvoicePageReply>(
    listPath(endpoints.invoices, page, filters),
  );
  return { invoices: reply.invoices, hasNextPage: reply.pagination.hasNextPage };
}

export function getInvoice(id: string) {
  return protectedRequest<Invoice>(endpoints.invoices + '/' + encodeURIComponent(id));
}

export function createInvoice(data: {
  bookingId: string;
  unitsWorked?: number;
  poNumber?: string;
}) {
  return protectedRequest<Invoice>(endpoints.invoices, 'POST', data);
}

export function resendInvoice(id: string) {
  return protectedRequest<Invoice>(endpoints.invoices + '/' + encodeURIComponent(id) + '/send', 'POST');
}

export function voidInvoice(id: string) {
  return protectedRequest<Invoice>(endpoints.invoices + '/' + encodeURIComponent(id) + '/void', 'POST');
}

export function refundInvoice(id: string, amountPence?: number, reason?: RefundReason) {
  return protectedRequest<Invoice>(
    endpoints.invoices + '/' + encodeURIComponent(id) + '/refund',
    'POST',
    { amountPence, reason },
  );
}
