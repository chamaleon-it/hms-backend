import { BadRequestException } from '@nestjs/common';
import { ItemsService } from './items.service';

describe('ItemsService batch helpers', () => {
  const service = Object.create(ItemsService.prototype) as ItemsService;

  const batches = [
    {
      _id: 'b1',
      batchNumber: 'OLD',
      quantity: 10,
      expiryDate: new Date('2030-01-01'),
      purchasePrice: 5,
      supplier: 'A',
      createdAt: new Date('2024-01-01'),
    },
    {
      _id: 'b2',
      batchNumber: 'NEW',
      quantity: 5,
      expiryDate: new Date('2028-06-01'),
      purchasePrice: 6,
      supplier: 'B',
      createdAt: new Date('2025-01-01'),
    },
    {
      _id: 'b3',
      batchNumber: 'EXPIRED',
      quantity: 20,
      expiryDate: new Date('2020-01-01'),
      purchasePrice: 4,
      supplier: 'C',
      createdAt: new Date('2019-01-01'),
    },
  ];

  it('FEFO sorts by earliest expiry and excludes expired by default', () => {
    const sorted = service.sortBatches(batches, 'fefo');
    expect(sorted.map((b) => b.batchNumber)).toEqual(['NEW', 'OLD']);
  });

  it('FIFO sorts by createdAt and excludes expired by default', () => {
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

  it('deductFromBatch blocks expired and oversell', async () => {
    const item: any = {
      name: 'Para',
      quantity: 20,
      unitPrice: 10,
      soldQuantity: 0,
      soldHistory: [],
      batches: [
        {
          _id: { toString: () => 'b3' },
          batchNumber: 'EXPIRED',
          quantity: 20,
          expiryDate: new Date('2020-01-01'),
        },
        {
          _id: { toString: () => 'b2' },
          batchNumber: 'NEW',
          quantity: 5,
          expiryDate: new Date('2030-01-01'),
        },
      ],
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue(true),
    };

    const svc: any = Object.create(ItemsService.prototype);
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
      svc.deductFromBatch('item1', 'b2', 10),
    ).rejects.toBeInstanceOf(BadRequestException);

    await svc.deductFromBatch('item1', 'b2', 2);
    expect(item.batches[1].quantity).toBe(3);
    expect(item.quantity).toBe(18);
    expect(item.soldQuantity).toBe(2);
    expect(item.save).toHaveBeenCalled();
  });
});
