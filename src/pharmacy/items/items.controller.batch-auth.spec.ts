import { ForbiddenException } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { UserRole } from 'src/users/schemas/user.schema';
import mongoose from 'mongoose';

describe('ItemsController.updateBatch stock policy (H3)', () => {
  const itemsService = {
    updateBatchByNumber: jest.fn().mockResolvedValue({ ok: true }),
  };
  const controller = new ItemsController(itemsService as any);
  const id = new mongoose.Types.ObjectId();

  beforeEach(() => {
    itemsService.updateBatchByNumber.mockClear();
  });

  it('blocks Pharmacy from sending quantity / startingQuantity', async () => {
    await expect(
      controller.updateBatch(
        id,
        'B1',
        { quantity: 999, saleRate: 12 },
        { id, email: 'p@x.com', role: UserRole.PHARMACY } as any,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(itemsService.updateBatchByNumber).not.toHaveBeenCalled();
  });

  it('allows Pharmacy to update rates without quantity fields', async () => {
    await controller.updateBatch(
      id,
      'B1',
      { saleRate: 15, mrp: 20 },
      { id, email: 'p@x.com', role: UserRole.PHARMACY } as any,
    );
    expect(itemsService.updateBatchByNumber).toHaveBeenCalled();
  });

  it('allows Admin to update batch quantity', async () => {
    await controller.updateBatch(
      id,
      'B1',
      { quantity: 50 },
      { id, email: 'a@x.com', role: UserRole.ADMIN } as any,
    );
    expect(itemsService.updateBatchByNumber).toHaveBeenCalledWith(
      id,
      'B1',
      { quantity: 50 },
    );
  });
});
