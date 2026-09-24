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
      purchasePrice: 5,
      saleRate: 12,
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
      saleRate: 14,
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
      saleRate: 10,
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
      saleRate: 16,
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

  it('recalculateItemStockFromBatches sums only active batches', () => {
    const item: any = {
      batches: [
        { quantity: 10, status: 'active', expiryDate: new Date('2030-01-01'), saleRate: 12, purchaseRate: 5, mrp: 15, createdAt: new Date('2024-01-01'), supplier: 'A' },
        { quantity: 5, status: 'inactive', expiryDate: new Date('2029-01-01'), saleRate: 14, purchaseRate: 6, mrp: 18, createdAt: new Date('2025-01-01'), supplier: 'B' },
        { quantity: 3, status: 'active', expiryDate: new Date('2028-01-01'), saleRate: 11, purchaseRate: 4, mrp: 13, createdAt: new Date('2025-06-01'), supplier: 'C' },
      ],
      markModified: jest.fn(),
    };
    service.recalculateItemStockFromBatches(item);
    expect(item.quantity).toBe(13);
    expect(item.unitPrice).toBe(11); // latest active by createdAt
    expect(item.purchasePrice).toBe(4);
    expect(item.mrp).toBe(13);
  });

  it('dual-reads purchasePrice when purchaseRate missing', () => {
    expect(service.resolvePurchaseRate({ purchasePrice: 9 })).toBe(9);
    expect(service.resolveSaleRate({ saleRate: 11 }, 5)).toBe(11);
    expect(service.resolveSaleRate({}, 5)).toBe(5);
  });

  it('ensureLegacyBatchFromFlatItem seeds opening batch without dropping flat fields', () => {
    const item: any = {
      batches: [],
      quantity: 25,
      unitPrice: 10,
      purchasePrice: 6,
      mrp: 12,
      supplier: 'LegacyCo',
      expiryDate: new Date('2030-05-01'),
      markModified: jest.fn(),
    };
    expect(service.ensureLegacyBatchFromFlatItem(item)).toBe(true);
    expect(item.batches).toHaveLength(1);
    expect(item.batches[0].batchNumber).toBe('LEGACY-OPENING');
    expect(item.batches[0].quantity).toBe(25);
    expect(item.batches[0].saleRate).toBe(10);
    expect(item.unitPrice).toBe(10); // flat fields preserved
  });

  it('sanitizeSearchRegex escapes metacharacters', () => {
    const svc: any = service;
    expect(svc.sanitizeSearchRegex('para.')).toBe('para\\.');
    expect(svc.sanitizeSearchRegex('a(b)')).toBe('a\\(b\\)');
  });

  it('H4: ensureValidPacking normalizes packing < 1 to 1 (avoids schema 500)', () => {
    const item: any = { packing: 0 };
    service.ensureValidPacking(item);
    expect(item.packing).toBe(1);

    const missing: any = {};
    service.ensureValidPacking(missing);
    expect(missing.packing).toBe(1);

    const ok: any = { packing: 10 };
    service.ensureValidPacking(ok);
    expect(ok.packing).toBe(10);
  });

  it('deductFromBatch blocks expired, inactive, zero, and oversell', async () => {
    const item: any = {
      name: 'Para',
      quantity: 33,
      unitPrice: 10,
      soldQuantity: 0,
      soldHistory: [],
      batches: [
        {
          _id: { toString: () => 'b3' },
          batchNumber: 'EXPIRED',
          quantity: 20,
          expiryDate: new Date('2020-01-01'),
          status: BatchStatus.Active,
          saleRate: 10,
        },
        {
          _id: { toString: () => 'b2' },
          batchNumber: 'NEW',
          quantity: 5,
          expiryDate: new Date('2030-01-01'),
          status: BatchStatus.Active,
          saleRate: 14,
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
          saleRate: 16,
        },
      ],
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue(true),
    };

    const svc: any = Object.create(ItemsService.prototype);
    Object.assign(svc, {
      resolvePurchaseRate: service.resolvePurchaseRate.bind(service),
      resolveSaleRate: service.resolveSaleRate.bind(service),
      resolveBatchMrp: service.resolveBatchMrp.bind(service),
      resolveBatchStatus: service.resolveBatchStatus.bind(service),
      isBatchActive: service.isBatchActive.bind(service),
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
    // Aggregate = all active-status batches (expired still counted until deactivated)
    expect(item.quantity).toBe(23);
    expect(item.soldQuantity).toBe(2);
    expect(item.soldHistory[0].unitPrice).toBe(14);
    expect(item.save).toHaveBeenCalled();
  });
});
