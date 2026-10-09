import {
  PurchaseEntryService,
  SUPPLIER_PAYMENT_PAGE_SIZE,
} from './purchase_entry.service';

const supplierId = '507f1f77bcf86cd799439011';

function payment(index: number) {
  return {
    _id: `507f1f77bcf86cd7994390${index.toString(16).padStart(2, '0')}`,
    supplier: supplierId,
    date: new Date(Date.UTC(2026, 0, index)),
    cash: index * 100,
    card: 0,
    upi: 0,
    total: index * 100,
    allocations: [
      {
        purchaseEntry: '507f1f77bcf86cd799439012',
        invoiceNumber: `BILL-${index}`,
        amount: index * 100,
      },
    ],
  };
}

describe('PurchaseEntryService.listSupplierPayments', () => {
  it('returns the newest page of stored payments for that supplier', async () => {
    const stored = [1, 2, 3, 4, 5, 6].map(payment);
    const supplierPaymentModel = {
      countDocuments: () => ({
        exec: () => stored.length,
      }),
      find: (filter: { supplier: string }) => {
        const matched = stored
          .filter((entry) => entry.supplier === filter.supplier)
          .sort((a, b) => b.date.getTime() - a.date.getTime());
        const query = {
          sort: () => query,
          skip: (count: number) => {
            query._skip = count;
            return query;
          },
          limit: (count: number) => {
            query._limit = count;
            return query;
          },
          select: () => query,
          exec: () => matched.slice(query._skip, query._skip + query._limit),
          _skip: 0,
          _limit: matched.length,
        };
        return query;
      },
    };
    const service = new PurchaseEntryService(
      {} as never,
      {} as never,
      {
        findById: () => ({
          exec: () => ({ _id: supplierId, isDeleted: false }),
        }),
      } as never,
      supplierPaymentModel as never,
    );

    const page = await service.listSupplierPayments(supplierId, {});

    expect(SUPPLIER_PAYMENT_PAGE_SIZE).toBe(5);
    expect(page.limit).toBe(5);
    expect(page.page).toBe(1);
    expect(page.total).toBe(6);
    expect(page.totalPages).toBe(2);
    expect(page.payments.map((entry) => entry.total)).toEqual([
      600, 500, 400, 300, 200,
    ]);
    expect(page.payments[0].allocations).toEqual([
      {
        purchaseEntry: '507f1f77bcf86cd799439012',
        invoiceNumber: 'BILL-6',
        amount: 600,
      },
    ]);

    const second = await service.listSupplierPayments(supplierId, {
      page: 2,
      limit: 5,
    });
    expect(second.payments.map((entry) => entry.total)).toEqual([100]);
  });

  it('returns an empty page when the supplier has no payments', async () => {
    const service = new PurchaseEntryService(
      {} as never,
      {} as never,
      {
        findById: () => ({
          exec: () => ({ _id: supplierId, isDeleted: false }),
        }),
      } as never,
      {
        countDocuments: () => ({ exec: () => 0 }),
        find: () => {
          const query = {
            sort: () => query,
            skip: () => query,
            limit: () => query,
            select: () => query,
            exec: () => [],
          };
          return query;
        },
      } as never,
    );

    const page = await service.listSupplierPayments(supplierId, { page: 1 });
    expect(page).toMatchObject({
      payments: [],
      total: 0,
      page: 1,
      limit: 5,
      totalPages: 0,
    });
  });
});
