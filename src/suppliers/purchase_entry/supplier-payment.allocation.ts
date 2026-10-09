import { PaymentStatus } from './schemas/purchase-entry.schema';

export const PAYMENT_OVER_DUE_MESSAGE = 'Payment total is over the due amount';
export const PAYMENT_NOT_POSITIVE_MESSAGE =
  'Payment total must be greater than 0';
export const PAYMENT_INVALID_AMOUNT_MESSAGE =
  'Cash, card, and UPI must be zero or greater';

export type SupplierPaymentAmounts = {
  cash: number;
  card: number;
  upi: number;
};

export type InvoiceForAllocation = {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date | string;
  total: number;
  paidAmount: number;
  paymentStatus?: string;
};

export type AllocationLine = {
  purchaseEntryId: string;
  invoiceNumber: string;
  amount: number;
};

export type InvoicePaymentUpdate = {
  id: string;
  previousPaidAmount: number;
  previousPaymentStatus?: string;
  paidAmount: number;
  paymentStatus: PaymentStatus;
};

export type SupplierPaymentPlan = {
  cash: number;
  card: number;
  upi: number;
  total: number;
  totalDue: number;
  allocations: AllocationLine[];
  updates: InvoicePaymentUpdate[];
};

export class SupplierPaymentError extends Error {
  constructor(
    public readonly code: 'invalid_amount' | 'non_positive' | 'over_due',
    message: string,
  ) {
    super(message);
    this.name = 'SupplierPaymentError';
  }
}

export function toPaise(value: number): number {
  return Math.round(value * 100);
}

export function duePaise(total: number, paidAmount: number): number {
  return Math.max(0, toPaise(total) - toPaise(paidAmount || 0));
}

export function dueAmount(total: number, paidAmount: number): number {
  return duePaise(total, paidAmount) / 100;
}

function amountPaise(value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new SupplierPaymentError(
      'invalid_amount',
      PAYMENT_INVALID_AMOUNT_MESSAGE,
    );
  }
  return toPaise(value);
}

function invoiceTime(value: Date | string): number {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

/** Oldest invoice date first. Matching dates use invoice number. */
export function compareOpenInvoices(
  a: Pick<InvoiceForAllocation, 'invoiceDate' | 'invoiceNumber'>,
  b: Pick<InvoiceForAllocation, 'invoiceDate' | 'invoiceNumber'>,
): number {
  const dateDiff = invoiceTime(a.invoiceDate) - invoiceTime(b.invoiceDate);
  if (dateDiff !== 0) return dateDiff;
  return String(a.invoiceNumber ?? '').localeCompare(
    String(b.invoiceNumber ?? ''),
    undefined,
    { numeric: true, sensitivity: 'base' },
  );
}

/**
 * Apply one supplier payment to open bills.
 * The oldest due invoice is cleared before any later invoice is touched.
 * Purchase totals are not changed; only paid amount and payment status move.
 */
export function planSupplierPayment(
  invoices: InvoiceForAllocation[],
  amounts: SupplierPaymentAmounts,
): SupplierPaymentPlan {
  const cashPaise = amountPaise(amounts.cash || 0);
  const cardPaise = amountPaise(amounts.card || 0);
  const upiPaise = amountPaise(amounts.upi || 0);
  const totalPaise = cashPaise + cardPaise + upiPaise;

  const open = [...invoices]
    .filter((invoice) => duePaise(invoice.total, invoice.paidAmount) > 0)
    .sort(compareOpenInvoices);

  const totalDuePaise = open.reduce(
    (sum, invoice) => sum + duePaise(invoice.total, invoice.paidAmount),
    0,
  );

  if (totalPaise <= 0) {
    throw new SupplierPaymentError(
      'non_positive',
      PAYMENT_NOT_POSITIVE_MESSAGE,
    );
  }
  if (totalPaise > totalDuePaise) {
    throw new SupplierPaymentError('over_due', PAYMENT_OVER_DUE_MESSAGE);
  }

  let remainingPaise = totalPaise;
  const allocations: AllocationLine[] = [];
  const updates: InvoicePaymentUpdate[] = [];

  for (const invoice of open) {
    if (remainingPaise <= 0) break;
    const openDuePaise = duePaise(invoice.total, invoice.paidAmount);
    const appliedPaise = Math.min(openDuePaise, remainingPaise);
    if (appliedPaise <= 0) continue;

    const paidPaise = toPaise(invoice.paidAmount || 0) + appliedPaise;
    const totalInvoicePaise = toPaise(invoice.total);
    const closed = paidPaise >= totalInvoicePaise;

    allocations.push({
      purchaseEntryId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: appliedPaise / 100,
    });
    updates.push({
      id: invoice.id,
      previousPaidAmount: invoice.paidAmount || 0,
      previousPaymentStatus: invoice.paymentStatus,
      paidAmount: closed ? invoice.total : paidPaise / 100,
      paymentStatus: closed ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID,
    });
    remainingPaise -= appliedPaise;
  }

  return {
    cash: cashPaise / 100,
    card: cardPaise / 100,
    upi: upiPaise / 100,
    total: totalPaise / 100,
    totalDue: totalDuePaise / 100,
    allocations,
    updates,
  };
}
