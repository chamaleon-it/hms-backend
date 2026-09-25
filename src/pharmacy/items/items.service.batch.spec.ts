import { BadRequestException } from '@nestjs/common';
import { ItemsService } from './items.service';
import { BatchStatus } from './schemas/item.schema';

describe('ItemsService batch helpers', () => {
  const service = Object.create(ItemsService.prototype) as ItemsService;

  const batches = [
    {
      _id: 'b1',
      batchNumber: 'OLD',
      quantity: 10,
      expiryDate: new Date('2030-01-01'),
      purchaseRate: 5,
      unitPrice: 12,
      mrp: 15,
      startingQuantity: 10,
      status: BatchStatus.Active,
      supplier: 'A',
      createdAt: new Date('2024-01-01'),
    },
    {
      _id: 'b2',
      batchNumber: 'NEW',
      quantity: 5,
      expiryDate: new Date('2028-06-01'),
      purchaseRate: 6,
      unitPrice: 14,
      mrp: 18,
      startingQuantity: 5,
      status: BatchStatus.Active,
      supplier: 'B',
      createdAt: new Date('2025-01-01'),
    },
    {
      _id: 'b3',
      batchNumber: 'EXPIRED',
      quantity: 20,
      expiryDate: new Date('2020-01-01'),
      purchaseRate: 4,
      unitPrice: 10,
      mrp: 12,
      startingQuantity: 20,
      status: BatchStatus.Active,
      supplier: 'C',
      createdAt: new Date('2019-01-01'),
    },
    {
      _id: 'b4',
      batchNumber: 'INACTIVE',
      quantity: 8,
      expiryDate: new Date('2031-01-01'),
      purchaseRate: 7,
      unitPrice: 16,
      mrp: 20,
      startingQuantity: 8,
      status: BatchStatus.Inactive,
      supplier: 'D',
      createdAt: new Date('2025-06-01'),
    },
  ];

  it('FEFO sorts by earliest expiry and excludes expired + inactive by default', () => {
    const sorted = service.sortBatches(batches, 'fefo');
    expect(sorted.map((b) => b.batchNumber)).toEqual(['NEW', 'OLD']);
  });

  it('FIFO sorts by createdAt and excludes expired + inactive by default', () => {
    const sorted = service.sortBatches(batches, 'fifo');
    expect(sorted.map((b) => b.batchNumber)).toEqual(['OLD', 'NEW']);
  });

  it('includeExpired keeps expired batches', () => {
    const sorted = service.sortBatches(batches, 'fefo', {
      includeExpired: true,
    });
    expect(sorted.map((b) => b.batchNumber)).toEqual([
      'EXPIRED',
      'NEW',
      'OLD',
    ]);
  });

  it('includeInactive keeps inactive batches', () => {
    const sorted = service.sortBatches(batches, 'fefo', {
      includeInactive: true,
    });
    expect(sorted.map((b) => b.batchNumber)).toEqual([
      'NEW',
      'OLD',
      'INACTIVE',
    ]);
  });

  it('sumActiveQuantity sums only active batches; recalculate does not write quantity', () => {
    const item: any = {
      batches: [
        {
          quantity: 10,
          status: 'active',
          expiryDate: new Date('2030-01-01'),
          unitPrice: 12,
          purchaseRate: 5,
          mrp: 15,
          createdAt: new Date('2024-01-01'),
          supplier: 'A',
        },
        {
          quantity: 5,
          status: 'inactive',
          expiryDate: new Date('2029-01-01'),
          unitPrice: 14,
          purchaseRate: 6,
          mrp: 18,
          createdAt: new Date('2025-01-01'),
          supplier: 'B',
        },
        {
          quantity: 3,
          status: 'active',
          expiryDate: new Date('2028-01-01'),
          unitPrice: 11,
          purchaseRate: 4,
          mrp: 13,
          createdAt: new Date('2025-06-01'),
          supplier: 'C',
        },
      ],
      markModified: jest.fn(),
    };
    expect(service.sumActiveQuantity(item)).toBe(13);
    expect(service.earliestExpiry(item)).toEqual(new Date('2028-01-01'));
    service.recalculateItemStockFromBatches(item);
    expect(item.quantity).toBeUndefined();
    expect(item.expiryDate).toBeUndefined();
    expect(item.markModified).toHaveBeenCalledWith('batches');
  });

  it('resolves unitPrice and purchaseRate from batch fields only', () => {
    expect(service.resolvePurchaseRate({ purchaseRate: 9 })).toBe(9);
    expect(service.resolvePurchaseRate({ purchasePrice: 9 })).toBe(0);
    expect(service.resolveUnitPrice({ unitPrice: 11 })).toBe(11);
    expect(service.resolveUnitPrice({ saleRate: 11 })).toBe(0);
    expect(service.resolveUnitPrice({})).toBe(0);
  });

  it('purchase stock value = (purchaseRate/pack)×current qty; tracks stock like selling', () => {
    const batch = {
      purchaseRate: 110,
      packing: 10,
      stripCount: 10,
      quantity: 100,
      unitPrice: 12,
      mrp: 120,
    };
    expect(service.resolveBatchPurchaseValue(batch)).toBe(1100);
    expect(service.resolveUnitPrice(batch) * batch.quantity).toBe(1200);
    // After selling 40 units, both values shrink with remaining qty
    const afterSale = { ...batch, quantity: 60 };
    expect(service.resolveBatchPurchaseValue(afterSale)).toBe(660);
    expect(service.resolveUnitPrice(afterSale) * afterSale.quantity).toBe(720);
    // stripCount must NOT freeze purchase value after sales
    expect(
      service.resolveBatchPurchaseValue({
        purchaseRate: 110,
        packing: 10,
        stripCount: 10,
        quantity: 50,
      }),
    ).toBe(550);
  });

  it('enrichItem adds computed display fields from latest active batch', () => {
    const lean = {
      name: 'Para',
      batches: [
        {
          quantity: 10,
          status: 'active',
          expiryDate: new Date('2030-01-01'),
          unitPrice: 12,
          purchaseRate: 5,
          mrp: 15,
          supplier: 'A',
          createdAt: new Date('2024-01-01'),
        },
        {
          quantity: 3,
          status: 'active',
          expiryDate: new Date('2028-01-01'),
          unitPrice: 14,
          purchaseRate: 6,
          mrp: 18,
          supplier: 'B',
          createdAt: new Date('2025-06-01'),
        },
      ],
    };
    const enriched = service.enrichItem(lean);
    expect(enriched.quantity).toBe(13);
    expect(enriched.expiryDate).toEqual(new Date('2028-01-01'));
    expect(enriched.unitPrice).toBe(14);
    expect(enriched.mrp).toBe(18);
    expect(enriched.purchasePrice).toBe(6);
    expect(enriched.supplier).toBe('B');
  });

  it('sanitizeSearchRegex escapes metacharacters', () => {
    const svc: any = service;
    expect(svc.sanitizeSearchRegex('para.')).toBe('para\\.');
    expect(svc.sanitizeSearchRegex('a(b)')).toBe('a\\(b\\)');
  });

  it('deductFromBatch blocks expired, inactive, zero, and oversell', async () => {
    const item: any = {
      name: 'Para',
      soldQuantity: 0,
      soldHistory: [],
      batches: [
        {
          _id: { toString: () => 'b3' },
          batchNumber: 'EXPIRED',
          quantity: 20,
          expiryDate: new Date('2020-01-01'),
          status: BatchStatus.Active,
          unitPrice: 10,
        },
        {
          _id: { toString: () => 'b2' },
          batchNumber: 'NEW',
          quantity: 5,
          expiryDate: new Date('2030-01-01'),
          status: BatchStatus.Active,
          unitPrice: 14,
          purchaseRate: 6,
          mrp: 18,
          createdAt: new Date('2025-01-01'),
        },
        {
          _id: { toString: () => 'b4' },
          batchNumber: 'INACTIVE',
          quantity: 8,
          expiryDate: new Date('2031-01-01'),
          status: BatchStatus.Inactive,
          unitPrice: 16,
        },
      ],
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue(true),
    };

    const svc: any = Object.create(ItemsService.prototype);
    Object.assign(svc, {
      resolvePurchaseRate: service.resolvePurchaseRate.bind(service),
      resolveUnitPrice: service.resolveUnitPrice.bind(service),
      resolveItemUnitPrice: service.resolveItemUnitPrice.bind(service),
      resolveBatchMrp: service.resolveBatchMrp.bind(service),
      resolveBatchStatus: service.resolveBatchStatus.bind(service),
      isBatchActive: service.isBatchActive.bind(service),
      activeBatches: service.activeBatches.bind(service),
      sumActiveQuantity: service.sumActiveQuantity.bind(service),
      recalculateItemStockFromBatches:
        service.recalculateItemStockFromBatches.bind(service),
    });
    svc.itemModel = {
      findById: jest.fn().mockResolvedValue(item),
    };
    svc.usersService = {
      getPharmacyInventoryAllowNegativeStock: jest
        .fn()
        .mockResolvedValue(false),
    };

    await expect(
      svc.deductFromBatch('item1', 'b3', 1),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      svc.deductFromBatch('item1', 'b4', 1),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      svc.deductFromBatch('item1', 'b2', 10),
    ).rejects.toBeInstanceOf(BadRequestException);

    await svc.deductFromBatch('item1', 'b2', 2);
    expect(item.batches[1].quantity).toBe(3);
    expect(service.sumActiveQuantity(item)).toBe(23);
    expect(item.quantity).toBeUndefined();
    expect(item.soldQuantity).toBe(2);
    expect(item.soldHistory[0].unitPrice).toBe(14);
    expect(item.save).toHaveBeenCalled();
  });
});
