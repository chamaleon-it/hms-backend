import { BadRequestException } from '@nestjs/common';
import { ConsumablesService } from './consumables.service';

describe('ConsumablesService', () => {
  let service: ConsumablesService;
  let itemModel: any;
  let issueModel: any;

  beforeEach(() => {
    itemModel = {
      find: jest.fn(),
      findById: jest.fn(),
      db: {
        startSession: jest.fn().mockResolvedValue({
          startTransaction: jest.fn(),
          commitTransaction: jest.fn(),
          abortTransaction: jest.fn(),
          endSession: jest.fn(),
        }),
      },
    };
    issueModel = {
      create: jest.fn(),
      find: jest.fn(),
    };
    service = new ConsumablesService(itemModel, issueModel);
  });

  it('rejects issuing a non-consumable item', async () => {
    const save = jest.fn();
    itemModel.findById.mockReturnValue({
      session: () =>
        Promise.resolve({
          status: 'Active',
          category: 'Medicine',
          batches: [
            {
              quantity: 10,
              status: 'active',
              purchaseRate: 5,
              expiryDate: new Date('2030-01-01'),
            },
          ],
          save,
        }),
    });

    await expect(
      service.issue('507f1f77bcf86cd799439011' as any, {
        itemId: '507f1f77bcf86cd799439012',
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects insufficient stock', async () => {
    itemModel.findById.mockReturnValue({
      session: () =>
        Promise.resolve({
          status: 'Active',
          category: 'Consumables',
          batches: [
            {
              quantity: 1,
              status: 'active',
              purchaseRate: 5,
              expiryDate: new Date('2030-01-01'),
            },
          ],
          save: jest.fn(),
          markModified: jest.fn(),
        }),
    });

    await expect(
      service.issue('507f1f77bcf86cd799439011' as any, {
        itemId: '507f1f77bcf86cd799439012',
        quantity: 5,
      }),
    ).rejects.toThrow(/Insufficient stock/);
  });

  it('lists only consumable category items', async () => {
    const lean = jest.fn().mockResolvedValue([{ name: 'Gloves' }]);
    const sort = jest.fn().mockReturnValue({ lean });
    const select = jest.fn().mockReturnValue({ sort });
    itemModel.find.mockReturnValue({ select });

    await service.listConsumables();

    expect(itemModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        category: { $regex: /^consumables?$/i },
      }),
    );
  });
});
