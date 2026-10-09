import { BadRequestException } from '@nestjs/common';
import { PaymentStatus } from './schemas/purchase-entry.schema';
import { PurchaseEntryService } from './purchase_entry.service';
import { PAYMENT_OVER_DUE_MESSAGE } from './supplier-payment.allocation';

const supplierId = '507f1f77bcf86cd799439011';
const bill1Id = '507f1f77bcf86cd799439012';
const bill2Id = '507f1f77bcf86cd799439013';

function createHarness() {
  const bills = [
    {
      _id: bill2Id,
      supplier: supplierId,
      invoiceNumber: 'BILL-2',
      invoiceDate: new Date('2026-02-01'),
      total: 6000,
      paidAmount: 0,
      paymentStatus: PaymentStatus.PENDING,
    },
    {
      _id: bill1Id,
      supplier: supplierId,
      invoiceNumber: 'BILL-1',
      invoiceDate: new Date('2026-01-01'),
      total: 5000,
      paidAmount: 0,
      paymentStatus: PaymentStatus.PENDING,
    },
  ];
  const payments: Array<Record<string, unknown>> = [];
  let supplierWrites = 0;

  const purchaseEntryModel = {
    find: () => {
      const query = {
        select: () => query,
        exec: () => bills.map((bill) => ({ ...bill })),
      };
      return query;
    },
    updateOne: (
      filter: { _id: string; paidAmount: number },
      update: { $set: { paidAmount: number; paymentStatus: string } },
    ) => {
      const bill = bills.find(
        (entry) =>
          entry._id === filter._id && entry.paidAmount === filter.paidAmount,
      );
      if (!bill) return { matchedCount: 0 };
      bill.paidAmount = update.$set.paidAmount;
      bill.paymentStatus = update.$set.paymentStatus as PaymentStatus;
      return { matchedCount: 1 };
    },
  };

  const supplierModel = {
    findById: () => ({
      exec: () => ({ _id: supplierId, isDeleted: false, balance: 40 }),
    }),
    updateOne: () => {
      supplierWrites += 1;
      return { matchedCount: 1 };
    },
    findByIdAndUpdate: () => {
      supplierWrites += 1;
      return { exec: () => null };
    },
  };

  const supplierPaymentModel = {
    create: (doc: Record<string, unknown>) => {
      const saved = { _id: '507f1f77bcf86cd799439099', ...doc };
      payments.push(saved);
      return saved;
    },
  };

  const service = new PurchaseEntryService(
    purchaseEntryModel as never,
    {} as never,
    supplierModel as never,
    supplierPaymentModel as never,
  );

  return { service, bills, payments, supplierWrites: () => supplierWrites };
}

describe('PurchaseEntryService.recordSupplierPayment', () => {
  it('stores the split and leaves 4500 due on the newer bill', async () => {
    const { service, bills, payments, supplierWrites } = createHarness();

    const saved = await service.recordSupplierPayment(supplierId, {
      cash: 2000,
      card: 3000,
      upi: 1500,
    });

    expect(saved).toMatchObject({
      supplier: supplierId,
      cash: 2000,
      card: 3000,
      upi: 1500,
      total: 6500,
    });
    expect(saved.date).toBeInstanceOf(Date);
    expect(saved.allocations).toEqual([
      { purchaseEntry: bill1Id, invoiceNumber: 'BILL-1', amount: 5000 },
      { purchaseEntry: bill2Id, invoiceNumber: 'BILL-2', amount: 1500 },
    ]);
    expect(payments).toHaveLength(1);

    const closed = bills.find((bill) => bill._id === bill1Id)!;
    const open = bills.find((bill) => bill._id === bill2Id)!;
    expect(closed).toMatchObject({
      total: 5000,
      paidAmount: 5000,
      paymentStatus: PaymentStatus.PAID,
    });
    expect(open).toMatchObject({
      total: 6000,
      paidAmount: 1500,
      paymentStatus: PaymentStatus.PARTIALLY_PAID,
    });
    expect(open.total - open.paidAmount).toBe(4500);
    expect(supplierWrites()).toBe(0);

    const dues = await service.listOpenInvoices(supplierId);
    expect(dues.totalDue).toBe(4500);
    expect(dues.invoices).toEqual([
      expect.objectContaining({
        _id: bill2Id,
        invoiceNumber: 'BILL-2',
        dueAmount: 4500,
      }),
    ]);
  });

  it('does not store a payment that exceeds the due', async () => {
    const { service, bills, payments } = createHarness();

    await expect(
      service.recordSupplierPayment(supplierId, {
        cash: 12000,
        card: 0,
        upi: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.recordSupplierPayment(supplierId, {
        cash: 12000,
        card: 0,
        upi: 0,
      }),
    ).rejects.toThrow(PAYMENT_OVER_DUE_MESSAGE);

    expect(payments).toHaveLength(0);
    expect(bills.map((bill) => bill.paidAmount)).toEqual([0, 0]);
    expect(bills.map((bill) => bill.total)).toEqual([6000, 5000]);
  });
});
