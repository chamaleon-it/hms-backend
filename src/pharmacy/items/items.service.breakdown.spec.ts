import { ItemsService } from './items.service';

describe('ItemsService.getInventoryValueBreakdown', () => {
  let service: ItemsService;
  let itemModel: { aggregate: jest.Mock; find: jest.Mock };

  beforeEach(() => {
    itemModel = {
      aggregate: jest.fn(),
      find: jest.fn(),
    };
    service = new ItemsService(itemModel as any, {} as any);
  });

  it('returns category and total purchase vs selling values (no MRP value)', async () => {
    itemModel.aggregate
      .mockResolvedValueOnce([
        {
          _id: 'Medicine',
          itemCount: 2,
          quantity: 10,
          sellingValue: 200,
          purchaseValue: 100,
        },
        {
          _id: 'Consumables',
          itemCount: 1,
          quantity: 5,
          sellingValue: 50,
          purchaseValue: 30,
        },
      ])
      .mockResolvedValueOnce([
        {
          sellingValue: 250,
          purchaseValue: 130,
          totalQuantity: 15,
          totalItems: 3,
        },
      ])
      .mockResolvedValueOnce([
        {
          _id: '1',
          name: 'Paracetamol',
          category: 'Medicine',
          quantity: 10,
          sellingValue: 200,
          purchaseValue: 100,
        },
      ]);

    const result = await service.getInventoryValueBreakdown();

    expect(result.totals.sellingValue).toBe(250);
    expect(result.totals.purchaseValue).toBe(130);
    expect((result.totals as any).mrpValue).toBeUndefined();
    expect(result.byCategory).toHaveLength(2);
    expect(result.byCategory[0].category).toBe('Medicine');
    expect(result.topItems[0].sellingValue).toBe(200);
    expect(result.topItems[0].name).toBe('Paracetamol');
    expect(itemModel.find).not.toHaveBeenCalled();
  });
});
