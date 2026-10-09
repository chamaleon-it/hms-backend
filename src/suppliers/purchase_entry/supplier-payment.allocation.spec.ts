import { PaymentStatus } from './schemas/purchase-entry.schema';
import {
  PAYMENT_NOT_POSITIVE_MESSAGE,
  PAYMENT_OVER_DUE_MESSAGE,
  SupplierPaymentError,
  dueAmount,
  planSupplierPayment,
} from './supplier-payment.allocation';

const bill = (
  id: string,
  invoiceNumber: string,
  invoiceDate: string,
  total: number,
  paidAmount = 0,
) => ({
  id,
  invoiceNumber,
  invoiceDate,
  total,
  paidAmount,
  paymentStatus:
    paidAmount <= 0 ? PaymentStatus.PENDING : PaymentStatus.PARTIALLY_PAID,
});

describe('planSupplierPayment', () => {
  it('closes the oldest bill before reducing the next one', () => {
    const plan = planSupplierPayment(
      [
        bill('bill-2', 'BILL-2', '2026-02-01', 6000),
        bill('bill-1', 'BILL-1', '2026-01-01', 5000),
      ],
      { cash: 2000, card: 3000, upi: 1500 },
    );

    expect(plan.total).toBe(6500);
    expect(plan.totalDue).toBe(11000);
    expect(plan.cash).toBe(2000);
    expect(plan.card).toBe(3000);
    expect(plan.upi).toBe(1500);
    expect(plan.allocations).toEqual([
      { purchaseEntryId: 'bill-1', invoiceNumber: 'BILL-1', amount: 5000 },
      { purchaseEntryId: 'bill-2', invoiceNumber: 'BILL-2', amount: 1500 },
    ]);
    expect(plan.updates).toEqual([
      expect.objectContaining({
        id: 'bill-1',
        paidAmount: 5000,
        paymentStatus: PaymentStatus.PAID,
      }),
      expect.objectContaining({
        id: 'bill-2',
        paidAmount: 1500,
        paymentStatus: PaymentStatus.PARTIALLY_PAID,
      }),
    ]);
    expect(
      plan.updates.every((update) => update.paidAmount !== undefined),
    ).toBe(true);
    expect(
      dueAmount(
        6000,
        plan.updates.find((update) => update.id === 'bill-2')!.paidAmount,
      ),
    ).toBe(4500);
    expect(
      dueAmount(
        5000,
        plan.updates.find((update) => update.id === 'bill-1')!.paidAmount,
      ),
    ).toBe(0);
    // Purchase totals stay on the bills; the plan never rewrites them.
    expect(plan.updates.map((update) => update.paidAmount)).toEqual([
      5000, 1500,
    ]);
  });

  it('orders matching invoice dates by invoice number', () => {
    const plan = planSupplierPayment(
      [
        bill('later-number', '10', '2026-03-01', 100),
        bill('earlier-number', '2', '2026-03-01', 100),
      ],
      { cash: 50, card: 0, upi: 0 },
    );

    expect(plan.allocations[0]).toMatchObject({
      purchaseEntryId: 'earlier-number',
      invoiceNumber: '2',
      amount: 50,
    });
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].paidAmount).toBe(50);
    expect(plan.updates[0].paymentStatus).toBe(PaymentStatus.PARTIALLY_PAID);
  });

  it('rejects a payment that is over the due and a payment of zero', () => {
    expect(() =>
      planSupplierPayment([bill('bill-1', 'BILL-1', '2026-01-01', 5000)], {
        cash: 5001,
        card: 0,
        upi: 0,
      }),
    ).toThrow(PAYMENT_OVER_DUE_MESSAGE);

    expect(() =>
      planSupplierPayment([bill('bill-1', 'BILL-1', '2026-01-01', 5000)], {
        cash: 0,
        card: 0,
        upi: 0,
      }),
    ).toThrow(PAYMENT_NOT_POSITIVE_MESSAGE);

    try {
      planSupplierPayment([bill('bill-1', 'BILL-1', '2026-01-01', 5000)], {
        cash: 6000,
        card: 0,
        upi: 0,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(SupplierPaymentError);
      expect((error as SupplierPaymentError).code).toBe('over_due');
    }
  });

  it('skips invoices that are already settled', () => {
    const plan = planSupplierPayment(
      [
        bill('closed', 'BILL-0', '2025-12-01', 1000, 1000),
        bill('open', 'BILL-1', '2026-01-01', 800, 300),
      ],
      { cash: 0, card: 500, upi: 0 },
    );

    expect(plan.allocations).toEqual([
      { purchaseEntryId: 'open', invoiceNumber: 'BILL-1', amount: 500 },
    ]);
    expect(plan.updates[0]).toMatchObject({
      id: 'open',
      previousPaidAmount: 300,
      paidAmount: 800,
      paymentStatus: PaymentStatus.PAID,
    });
    expect(plan.totalDue).toBe(500);
  });
});
