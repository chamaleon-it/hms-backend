import { BillingService } from './billing.service';
import { pharmacySaleReceipts } from './pharmacy-receipt';
import {
  IncomeCategory,
  PaymentMethod,
  SourceModule,
  TransactionType,
} from 'src/accounts/enums/account-transaction.enum';
import { TallyLedgerGroup } from 'src/accounts/ledger-group';

describe('pharmacySaleReceipts', () => {
  it('exports INV-03061 cash 947.40 as one Pharmacy cash receipt', () => {
    expect(
      pharmacySaleReceipts({
        billingCategory: 'Pharmacy',
        transactionType: 'Sale',
        cash: 947.4,
        card: 0,
        upi: 0,
      }),
    ).toEqual([{ method: 'Cash', amount: 947.4 }]);
  });

  it('does not receipt unpaid pharmacy bills', () => {
    expect(
      pharmacySaleReceipts({
        billingCategory: 'Pharmacy',
        cash: 0,
        card: 0,
        upi: 0,
      }),
    ).toEqual([]);
    expect(
      pharmacySaleReceipts({
        billingCategory: 'Pharmacy',
        transactionType: 'Sale',
        cash: 0,
        card: 0,
        upi: 0,
      }),
    ).toEqual([]);
  });

  it('keeps a cash/card/UPI split as one receipt per mode', () => {
    expect(
      pharmacySaleReceipts({
        billingCategory: 'Pharmacy',
        cash: 100,
        card: 200.5,
        upi: 50,
      }),
    ).toEqual([
      { method: 'Cash', amount: 100 },
      { method: 'Card', amount: 200.5 },
      { method: 'UPI', amount: 50 },
    ]);
  });

  it('skips returns, refunds, and other ledgers', () => {
    expect(
      pharmacySaleReceipts({
        billingCategory: 'Pharmacy',
        transactionType: 'Return',
        cash: 120,
      }),
    ).toEqual([]);
    expect(
      pharmacySaleReceipts({
        billingCategory: 'Pharmacy',
        transactionType: 'Refund',
        cash: 120,
      }),
    ).toEqual([]);
    expect(
      pharmacySaleReceipts({
        billingCategory: 'Reception',
        cash: 500,
      }),
    ).toEqual([]);
    expect(
      pharmacySaleReceipts({
        billingCategory: 'Procedure',
        cash: 500,
      }),
    ).toEqual([]);
  });

  it('does not post a second receipt when the sale is already exported', () => {
    expect(
      pharmacySaleReceipts({ billingCategory: 'Pharmacy', cash: 947.4 }, 947.4),
    ).toEqual([]);
  });

  it('subtracts a discount-only Medicine Sale so the receipts equal cash collected', () => {
    expect(
      pharmacySaleReceipts(
        { billingCategory: 'Pharmacy', cash: 947, card: 0, upi: 0 },
        50,
      ),
    ).toEqual([{ method: 'Cash', amount: 897 }]);
  });

  it('consumes already-exported cover cash first, then card, then UPI', () => {
    expect(
      pharmacySaleReceipts(
        { billingCategory: 'Pharmacy', cash: 100, card: 200, upi: 40 },
        150,
      ),
    ).toEqual([
      { method: 'Card', amount: 150 },
      { method: 'UPI', amount: 40 },
    ]);
  });
});

describe('BillingService.recordPharmacySaleReceipt', () => {
  function createService(accounts: {
    sumMedicineSaleReceipts: jest.Mock;
    recordTransaction: jest.Mock;
  }) {
    return new BillingService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      accounts as never,
    );
  }

  const bill = {
    mrn: 'INV-03061',
    billingCategory: 'Pharmacy' as const,
    transactionType: 'Sale' as const,
    cash: 947.4,
    card: 0,
    upi: 0,
    user: '64b000000000000000000001',
    createdAt: new Date('2026-10-29T09:53:00.000Z'),
  };

  it('records a deferred-or-live Medicine Sale receipt dated with the bill', async () => {
    const recordTransaction = jest.fn().mockResolvedValue({});
    const sumMedicineSaleReceipts = jest.fn().mockResolvedValue(0);
    const service = createService({
      sumMedicineSaleReceipts,
      recordTransaction,
    });

    await service.recordPharmacySaleReceipt(bill);

    expect(sumMedicineSaleReceipts).toHaveBeenCalledWith('INV-03061');
    expect(recordTransaction).toHaveBeenCalledWith({
      type: TransactionType.Income,
      category: IncomeCategory.MedicineSale,
      amount: 947.4,
      description: 'Pharmacy Bill #INV-03061 (Cash)',
      paymentMethod: PaymentMethod.Cash,
      sourceModule: SourceModule.Pharmacy,
      ledgerGroup: TallyLedgerGroup.Pharmacy,
      createdBy: bill.user,
      transactionDate: bill.createdAt,
    });
  });

  it('skips an unpaid pharmacy bill and an already-exported paid bill', async () => {
    const recordTransaction = jest.fn();
    const service = createService({
      sumMedicineSaleReceipts: jest.fn().mockResolvedValue(0),
      recordTransaction,
    });

    await service.recordPharmacySaleReceipt({
      ...bill,
      mrn: 'INV-03068',
      cash: 0,
    });
    expect(recordTransaction).not.toHaveBeenCalled();

    const exported = createService({
      sumMedicineSaleReceipts: jest.fn().mockResolvedValue(947.4),
      recordTransaction,
    });
    await exported.recordPharmacySaleReceipt(bill);
    expect(recordTransaction).not.toHaveBeenCalled();
  });

  it('defers the Tally push while backfilling into an in-progress sync', async () => {
    const recordTransaction = jest.fn().mockResolvedValue({});
    const service = createService({
      sumMedicineSaleReceipts: jest.fn().mockResolvedValue(0),
      recordTransaction,
    });

    await service.recordPharmacySaleReceipt(bill, { deferTally: true });

    expect(recordTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ deferTally: true, amount: 947.4 }),
    );
  });
});
