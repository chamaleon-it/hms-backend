import { TallyService } from './tally.service';
import {
  PaymentMethod,
  TransactionType,
} from 'src/accounts/enums/account-transaction.enum';
import { TallyLedgerGroup } from 'src/accounts/ledger-group';

/**
 * Verifies the four-ledger Tally routing end to end: for each product
 * ledger, a Receipt (Income) posts credit to that ledger's receipt side
 * and a Payment (Expense) posts debit to that ledger's payment side,
 * without touching the other three ledgers.
 */
describe('TallyService.syncAccountTransaction ledger routing', () => {
  const connectedDoc = {
    connected: true,
    host: 'localhost',
    port: 9000,
    cashLedger: 'Cash',
    upiLedger: 'UPI',
    cardLedger: 'Card',
    salesLedger: 'Pharmacy Sales',
    expenseLedger: 'Indirect Expenses',
    pharmacyPaymentLedger: 'Pharmacy Returns',
    therapyReceiptLedger: 'Therapy Income',
    therapyPaymentLedger: 'Therapy Refunds',
    receptionReceiptLedger: 'Reception Income',
    receptionPaymentLedger: 'Reception Refunds',
    purchasePaymentLedger: 'Purchase Payments',
    save: jest.fn(),
  };

  function createService() {
    const connectionModel = {
      findOne: jest.fn().mockResolvedValue(connectedDoc),
    };
    const accountTransactionModel = {
      findByIdAndUpdate: jest.fn().mockResolvedValue(undefined),
    };
    const service = new TallyService(
      connectionModel as never,
      accountTransactionModel as never,
    );
    return { service };
  }

  type FetchCall = [string, RequestInit];

  function mockFetchOnce(body = '<ENVELOPE><CREATED>1</CREATED></ENVELOPE>') {
    const fetchMock = jest
      .fn<Promise<{ ok: boolean; text: () => Promise<string> }>, FetchCall>()
      .mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(body),
      });
    (global as unknown as { fetch: typeof fetchMock }).fetch = fetchMock;
    return fetchMock;
  }

  async function syncAndCapture(
    service: TallyService,
    tx: Parameters<TallyService['syncAccountTransaction']>[0],
  ) {
    const fetchMock = mockFetchOnce();
    const outcome = await service.syncAccountTransaction(tx);
    const [, requestInit] = fetchMock.mock.calls[0];
    const postedXml = requestInit.body as string;
    return { outcome, postedXml };
  }

  const base = {
    transactionId: 'TXN-00001',
    amount: 500,
    description: 'test',
    paymentMethod: PaymentMethod.Cash,
  };

  it.each([
    ['Pharmacy', 'Medicine Sale', 'Pharmacy Sales'],
    ['Therapy', 'Therapy Income', 'Therapy Income'],
    ['Therapy', 'Procedure Income', 'Therapy Income'],
    ['Reception', 'Consultation Fee', 'Reception Income'],
  ])(
    '%s Receipt (category %s) credits %s and no other ledger',
    async (_group, category, expectedLedger) => {
      const { service } = createService();
      const { outcome, postedXml } = await syncAndCapture(service, {
        ...base,
        type: TransactionType.Income,
        category,
      });

      expect(outcome.status).toBe('synced');
      expect(postedXml).toContain('VCHTYPE="Receipt"');
      expect(postedXml).toContain(expectedLedger);
      for (const other of [
        'Pharmacy Returns',
        'Therapy Refunds',
        'Reception Refunds',
        'Purchase Payments',
      ]) {
        expect(postedXml).not.toContain(other);
      }
    },
  );

  it.each([
    ['Pharmacy', 'Sales Return', 'Pharmacy Returns'],
    ['Therapy', 'Therapy Refund', 'Therapy Refunds'],
    ['Reception', 'Refund', 'Reception Refunds'],
  ])(
    '%s Payment (category %s) debits %s and no other ledger',
    async (_group, category, expectedLedger) => {
      const { service } = createService();
      const { outcome, postedXml } = await syncAndCapture(service, {
        ...base,
        type: TransactionType.Expense,
        category,
      });

      expect(outcome.status).toBe('synced');
      expect(postedXml).toContain('VCHTYPE="Payment"');
      expect(postedXml).toContain(expectedLedger);
      for (const other of [
        'Pharmacy Sales',
        'Therapy Income',
        'Reception Income',
      ]) {
        expect(postedXml).not.toContain(other);
      }
    },
  );

  it('posts the separate NCF refund as a Reception Payment, and consultation fee collection as a Receipt', async () => {
    const { service } = createService();

    const ncf = await syncAndCapture(service, {
      ...base,
      type: TransactionType.Expense,
      category: 'Refund',
      ledgerGroup: TallyLedgerGroup.Reception,
      description: 'Reception NCF #REG-1',
    });
    expect(ncf.outcome.status).toBe('synced');
    expect(ncf.postedXml).toContain('VCHTYPE="Payment"');
    expect(ncf.postedXml).toContain('Reception Refunds');
    expect(ncf.postedXml).not.toContain('Reception Income');

    const collected = await syncAndCapture(service, {
      ...base,
      transactionId: 'TXN-00002',
      type: TransactionType.Income,
      category: 'Consultation Fee',
      description: 'Reception Bill #REG-1',
    });
    expect(collected.outcome.status).toBe('synced');
    expect(collected.postedXml).toContain('VCHTYPE="Receipt"');
    expect(collected.postedXml).toContain('Reception Income');
    expect(collected.postedXml).not.toContain('VCHTYPE="Payment"');
  });

  it('allocates a therapy voucher to the therapist cost centre and leaves other ledgers alone', async () => {
    const { service } = createService();
    const fetchMock = mockFetchOnce();
    const outcome = await service.syncAccountTransaction({
      ...base,
      type: TransactionType.Income,
      category: 'Therapy Income',
      costCentre: 'Sarah Connor',
    });

    expect(outcome.status).toBe('synced');
    expect(fetchMock.mock.calls).toHaveLength(2);
    const master = fetchMock.mock.calls[0][1].body as string;
    const voucher = fetchMock.mock.calls[1][1].body as string;
    expect(master).toContain(
      '<COSTCENTRE NAME="Sarah Connor" ACTION="Create">',
    );
    expect(master).toContain('<CATEGORY>Primary Cost Category</CATEGORY>');
    expect(voucher).toContain('VCHTYPE="Receipt"');
    expect(voucher).toContain('<LEDGERNAME>Therapy Income</LEDGERNAME>');
    expect(voucher).toContain('<LEDGERNAME>Cash</LEDGERNAME>');
    expect(voucher).toContain('<NAME>Sarah Connor</NAME>');
    expect(voucher).toContain('<AMOUNT>500.00</AMOUNT>');
    const cashLine = voucher.split('<ALLLEDGERENTRIES.LIST>')[1];
    expect(cashLine).toContain('<LEDGERNAME>Cash</LEDGERNAME>');
    expect(cashLine).not.toContain('COSTCENTRE');

    const plain = await syncAndCapture(service, {
      ...base,
      transactionId: 'TXN-00002',
      type: TransactionType.Income,
      category: 'Therapy Income',
    });
    expect(plain.postedXml).not.toContain('COSTCENTRE');

    const pharmacy = await syncAndCapture(service, {
      ...base,
      transactionId: 'TXN-00003',
      type: TransactionType.Income,
      category: 'Medicine Sale',
      costCentre: 'Sarah Connor',
    });
    expect(pharmacy.postedXml).not.toContain('Sarah Connor');
    expect(pharmacy.postedXml).not.toContain('COSTCENTRE');
  });

  it('posts a Purchase Payment to the Purchase ledger via the explicit ledgerGroup override', async () => {
    const { service } = createService();
    const { outcome, postedXml } = await syncAndCapture(service, {
      ...base,
      type: TransactionType.Expense,
      category: 'Purchase Payment',
      ledgerGroup: TallyLedgerGroup.Purchase,
    });

    expect(outcome.status).toBe('synced');
    expect(postedXml).toContain('VCHTYPE="Payment"');
    expect(postedXml).toContain('Purchase Payments');
  });

  it('backfills paid pharmacy sale receipts before reading pending vouchers', async () => {
    const backfillPaidPharmacyReceipts = jest.fn().mockResolvedValue(undefined);
    const sort = jest.fn().mockResolvedValue([]);
    const find = jest.fn().mockReturnValue({ sort });
    const connectionModel = {
      findOne: jest.fn().mockResolvedValue(connectedDoc),
    };
    const service = new TallyService(
      connectionModel as never,
      { find } as never,
      { backfillPaidPharmacyReceipts } as never,
    );
    jest.spyOn(service, 'testConnection').mockResolvedValue({
      ok: true,
      message: 'ok',
    } as Awaited<ReturnType<TallyService['testConnection']>>);
    jest
      .spyOn(
        service as unknown as { ensureDefaultLedgers: () => Promise<void> },
        'ensureDefaultLedgers',
      )
      .mockResolvedValue(undefined);

    await service.syncPending();

    expect(backfillPaidPharmacyReceipts).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenCalledWith({
      isDeleted: { $ne: true },
      tallySynced: { $ne: true },
      amount: { $gt: 0 },
    });
    expect(
      backfillPaidPharmacyReceipts.mock.invocationCallOrder[0],
    ).toBeLessThan(find.mock.invocationCallOrder[0]);
  });

  it('falls back to the generic ledger pair for categories outside the four product ledgers', async () => {
    const { service } = createService();
    const { outcome, postedXml } = await syncAndCapture(service, {
      ...base,
      type: TransactionType.Expense,
      category: 'Salary',
    });

    expect(outcome.status).toBe('synced');
    expect(postedXml).toContain('Indirect Expenses');
  });
});
