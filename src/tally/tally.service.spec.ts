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
