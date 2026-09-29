import { chosenBatch, resolveSaleLine } from './sale-line';

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
    expect(line.gstAmount).toBe(13.5);
    expect(line.net).toBe(283.5);
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
});
