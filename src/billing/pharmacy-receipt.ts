export type PaymentMode = 'Cash' | 'Card' | 'UPI';

const MODES: { method: PaymentMode; key: 'cash' | 'card' | 'upi' }[] = [
  { method: 'Cash', key: 'cash' },
  { method: 'Card', key: 'card' },
  { method: 'UPI', key: 'upi' },
];

function money(value: number | null | undefined): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Cash/card/UPI actually collected on a pharmacy sale, minus any Medicine
 * Sale receipt already recorded for the same invoice.
 *
 * Unpaid bills, returns, refunds, and every other billing category produce
 * nothing. Discount is not money in, so it is not part of the receipt.
 * Coverage is consumed cash, then card, then UPI so a discount-only receipt
 * created when the bill was first saved is not posted a second time.
 */
export function pharmacySaleReceipts(
  bill: {
    billingCategory?: string | null;
    transactionType?: string | null;
    cash?: number | null;
    card?: number | null;
    upi?: number | null;
  },
  alreadyExported = 0,
): { method: PaymentMode; amount: number }[] {
  if (bill.billingCategory !== 'Pharmacy') return [];
  const type = String(bill.transactionType || 'Sale');
  if (type === 'Refund' || type === 'Return') return [];

  let remainingCovered = money(alreadyExported);
  const lines: { method: PaymentMode; amount: number }[] = [];
  for (const mode of MODES) {
    const modeAmount = money(bill[mode.key]);
    const exportable = Math.max(0, modeAmount - remainingCovered);
    remainingCovered = Math.max(0, remainingCovered - modeAmount);
    const amount = money(exportable);
    if (amount > 0.001) lines.push({ method: mode.method, amount });
  }
  return lines;
}
