import { ReturnService } from './return.service';

const saleBill = 'PH-00018';

function chain(rows: Array<Record<string, string>>) {
  const query = {
    select: () => query,
    lean: () => query,
    exec: () => rows,
  };
  return query;
}

describe('ReturnService.create', () => {
  it('gives each return its own bill number when the sale bill was already returned', async () => {
    const returns: Array<Record<string, unknown>> = [];
    const billings: Array<Record<string, unknown>> = [{ mrn: `R-${saleBill}` }];

    const returnModel = {
      create: (doc: Record<string, unknown>) => {
        const saved = { _id: `ret-${returns.length + 1}`, ...doc };
        returns.push(saved);
        return saved;
      },
      deleteOne: () => ({ deletedCount: 0 }),
      find: (filter: { billNo?: RegExp }) =>
        chain(
          returns
            .filter((entry) => filter.billNo?.test(String(entry.billNo)))
            .map((entry) => ({ billNo: String(entry.billNo) })),
        ),
    };
    const billingModel = {
      create: (doc: Record<string, unknown>) => {
        billings.push(doc);
        return doc;
      },
      find: (filter: { mrn?: RegExp }) =>
        chain(
          billings
            .filter((entry) => filter.mrn?.test(String(entry.mrn)))
            .map((entry) => ({ mrn: String(entry.mrn) })),
        ),
    };

    const service = new ReturnService(
      returnModel as never,
      billingModel as never,
      {
        getItem: () => ({ name: 'Paracetamol' }),
        increaseItem: () => undefined,
      } as never,
      { recordTransaction: () => undefined } as never,
    );

    const payload = {
      patient: '507f1f77bcf86cd799439011',
      order: '507f1f77bcf86cd799439012',
      refundMode: 'Cash',
      returnedBy: 'Patient',
      billNo: saleBill,
      items: [
        {
          name: '507f1f77bcf86cd799439013',
          quantity: 1,
          reason: 'Not Required',
          unitPrice: 20,
        },
      ],
    };

    const first = await service.create(payload as never);
    const second = await service.create(payload as never);

    expect(first?.billNo).toBe('R-00001');
    expect(second?.billNo).toBe('R-00002');
    expect(first).toMatchObject({ saleBillNo: saleBill });
    expect(billings.map((bill) => bill.mrn)).toEqual([
      `R-${saleBill}`,
      'R-00001',
      'R-00002',
    ]);
  });
});
