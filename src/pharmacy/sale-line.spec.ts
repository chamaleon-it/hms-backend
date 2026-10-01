import { batchSalePrice, chosenBatch, defaultSaleBatch, lineSaleBatch, resolveSaleLine } from './sale-line';

describe('pharmacy sale line', () => {
  const dolo = {
    name: 'Dolo',
    generic: 'test',
    unitPrice: 0,
    batches: [
      {
        batchNumber: 'DL-EXP-2027',
        unitPrice: 30,
        saleRate: 30,
        gst: 5,
        expiryDate: '2027-01-31',
        quantity: 57,
      },
    ],
  };

  it('prices qty 9 at the selected batch rate and does not keep batch B0 or a zero amount', () => {
    const line = resolveSaleLine({
      name: 'Dolo',
      quantity: 9,
      unitPrice: 0,
      gst: 0,
      batchNumber: 'B0',
      item: dolo,
    });

    expect(line.unitPrice).toBe(30);
    expect(line.quantity).toBe(9);
    expect(line.total).toBe(270);
    expect(line.total).not.toBe(0);
    expect(line.gst).toBe(5);
    expect(line.gstAmount).toBe(0);
    expect(line.net).toBe(270);
    expect(line.batchNumber).toBe('DL-EXP-2027');
    expect(line.batchNumber).not.toBe('B0');
  });

  it('keeps an order-line unit price of 30 when the medicine record has none', () => {
    const line = resolveSaleLine({
      name: 'Dolo',
      quantity: 9,
      unitPrice: 30,
      gst: 5,
      batchNumber: 'B0',
      item: { ...dolo, unitPrice: 0, batches: [{ batchNumber: 'B0', unitPrice: 0 }] },
    });

    expect(line.unitPrice).toBe(30);
    expect(line.total).toBe(270);
    expect(line.batchNumber).toBeUndefined();
  });

  it('uses the selected batch price instead of a different medicine price', () => {
    const line = resolveSaleLine({
      name: 'Dolo',
      quantity: 9,
      unitPrice: 0,
      batchNumber: 'BATCH-A',
      item: {
        unitPrice: 10,
        batches: [
          { batchNumber: 'BATCH-A', unitPrice: 30, gst: 5 },
          { batchNumber: 'BATCH-B', unitPrice: 99, gst: 12 },
        ],
      },
    });

    expect(line.unitPrice).toBe(30);
    expect(line.gst).toBe(5);
    expect(line.batchNumber).toBe('BATCH-A');
    expect(line.total).toBe(270);
  });

  it('does not treat an unselected batch as chosen when two batches exist', () => {
    const batches = [
      { batchNumber: 'B1', unitPrice: 1, quantity: 4000, expiryDate: '2032-08-01' },
      { batchNumber: 'B2', unitPrice: 9, quantity: 10, expiryDate: '2033-01-01' },
    ];

    expect(chosenBatch(batches, undefined)).toBeUndefined();
    expect(chosenBatch(batches, '')).toBeUndefined();
    expect(chosenBatch(batches, 'B0')).toBeUndefined();
    expect(chosenBatch(batches, 'B2')?.quantity).toBe(10);
    expect(chosenBatch(batches, 'b2')?.unitPrice).toBe(9);
  });

  it('prices a chosen batch from MRP when unit price was not copied onto the line', () => {
    const line = resolveSaleLine({
      name: 'Dolo',
      quantity: 15,
      unitPrice: 0,
      batchNumber: 'B2',
      item: {
        unitPrice: 1,
        batches: [
          { batchNumber: 'B1', unitPrice: 1, quantity: 4000 },
          { batchNumber: 'B2', unitPrice: 0, mrp: 30, packing: 10, quantity: 20 },
        ],
      },
    });

    expect(line.batchNumber).toBe('B2');
    expect(line.unitPrice).toBe(3);
    expect(line.total).toBe(45);
  });

  describe('defaultSaleBatch', () => {
    const now = new Date('2026-09-30T12:00:00.000Z');
    const batches = [
      { batchNumber: 'OLD', quantity: 20, expiryDate: '2026-01-01', isActive: true },
      { batchNumber: 'SOON', quantity: 10, expiryDate: '2026-10-15', isActive: true },
      { batchNumber: 'LATER', quantity: 40, expiryDate: '2027-06-01', isActive: true },
      { batchNumber: 'EMPTY', quantity: 0, expiryDate: '2026-10-01', isActive: true },
      { batchNumber: 'OFF', quantity: 50, expiryDate: '2026-10-02', isActive: false },
      { batchNumber: 'SHORT', quantity: 3, expiryDate: '2026-10-01', isActive: true },
    ];

    it('picks the soonest unexpired in-stock batch that covers the line', () => {
      const pick = defaultSaleBatch(batches, 8, now);
      expect(pick?.batch.batchNumber).toBe('SOON');
      expect(pick?.oversell).toBe(false);
    });

    it('picks the largest in-stock unexpired batch and flags oversell when none covers the line', () => {
      const pick = defaultSaleBatch(batches, 100, now);
      expect(pick?.batch.batchNumber).toBe('LATER');
      expect(pick?.oversell).toBe(true);
    });

    it('treats a batch that expires today as still sellable and prefers it over a later one', () => {
      const pick = defaultSaleBatch(
        [
          { batchNumber: 'TODAY', quantity: 4, expiryDate: '2026-09-30' },
          { batchNumber: 'NEXT', quantity: 4, expiryDate: '2026-10-01' },
        ],
        2,
        now,
      );
      expect(pick?.batch.batchNumber).toBe('TODAY');
      expect(pick?.oversell).toBe(false);
    });

    it('sells an in-stock batch named B0 when the pharmacist has not chosen one', () => {
      const batches = [
        {
          batchNumber: 'B0',
          unitPrice: 12,
          mrp: 120,
          quantity: 60,
          expiryDate: '2031-11-01',
          isActive: true,
        },
      ];
      const pick = defaultSaleBatch(batches, 6, now);
      expect(pick?.batch.batchNumber).toBe('B0');
      expect(pick?.oversell).toBe(false);
      expect(batchSalePrice(pick?.batch)).toBe(12);

      expect(lineSaleBatch(batches, undefined, 6, now)?.quantity).toBe(60);
      expect(lineSaleBatch(batches, 'B0', 6, now)?.batchNumber).toBe('B0');
      expect(chosenBatch(batches, 'B0')).toBeUndefined();
    });

    it('sells in-stock B0 stock that has no expiry, and still skips a real batch with none', () => {
      expect(
        defaultSaleBatch(
          [{ batchNumber: 'B0', unitPrice: 12, mrp: 120, quantity: 320, isActive: true }],
          6,
          now,
        )?.batch.quantity,
      ).toBe(320);
      expect(
        defaultSaleBatch([{ batchNumber: 'B1', unitPrice: 5, quantity: 10 }], 1, now),
      ).toBeUndefined();
    });

    it('keeps the soonest real batch when B0 is only a placeholder and other stock exists', () => {
      const batches = [
        { batchNumber: 'B1', unitPrice: 1, quantity: 40, expiryDate: '2026-10-15' },
        { batchNumber: 'B2', unitPrice: 9, quantity: 10, expiryDate: '2027-01-01' },
      ];
      expect(lineSaleBatch(batches, 'B0', 6, now)?.batchNumber).toBe('B1');
      expect(lineSaleBatch(batches, 'B2', 6, now)?.unitPrice).toBe(9);
    });

    it('returns nothing when every batch is expired, empty, or inactive', () => {
      expect(
        defaultSaleBatch(
          [
            { batchNumber: 'OLD', quantity: 5, expiryDate: '2020-01-01' },
            { batchNumber: 'ZERO', quantity: 0, expiryDate: '2030-01-01' },
            { batchNumber: 'OFF', quantity: 9, expiryDate: '2030-01-01', isActive: false },
          ],
          1,
          now,
        ),
      ).toBeUndefined();
    });
  });
});
