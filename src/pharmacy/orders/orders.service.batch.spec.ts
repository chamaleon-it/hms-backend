import { BadRequestException } from '@nestjs/common';
import mongoose from 'mongoose';

const pharmacyId = new mongoose.Types.ObjectId().toHexString();

jest.mock('src/config/in-house', () => ({
  requireInHouseId: jest.fn(() => pharmacyId),
  getInHouseObjectId: jest.fn(
    () => new mongoose.Types.ObjectId(pharmacyId),
  ),
}));

import { OrdersService } from './orders.service';

describe('OrdersService.createOrder batch requirement', () => {
  const makeService = (batches: any[]) => {
    const service = Object.create(OrdersService.prototype) as OrdersService;
    (service as any).generateUniqueMRN = jest.fn().mockResolvedValue('RX1');
    (service as any).orderModel = { create: jest.fn().mockResolvedValue({}) };
    (service as any).usersService = {
      getPharmacyBilling: jest.fn().mockResolvedValue({ autoGenerateBill: false }),
      getPharmacyInventoryAllowNegativeStock: jest.fn().mockResolvedValue(false),
    };
    (service as any).itemsService = {
      getItemBatches: jest.fn().mockResolvedValue({
        name: 'Paracetamol',
        batches,
      }),
    };
    (service as any).billingService = {};
    return service;
  };

  it('rejects order lines when stocked batches exist but batchId is missing', async () => {
    const service = makeService([
      {
        batchId: 'b1',
        batchNumber: 'B1',
        stock: 10,
        expired: false,
        available: true,
      },
    ]);

    await expect(
      service.createOrder({
        patient: '507f1f77bcf86cd799439011' as any,
        items: [{ name: '507f1f77bcf86cd799439012' as any, quantity: 1 }],
        priority: 'Normal' as any,
        status: 'Pending' as any,
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows omit when no available batches exist', async () => {
    const service = makeService([]);
    await expect(
      service.createOrder({
        patient: '507f1f77bcf86cd799439011' as any,
        items: [{ name: '507f1f77bcf86cd799439012' as any, quantity: 1 }],
        priority: 'Normal' as any,
        status: 'Pending' as any,
      } as any),
    ).resolves.toBeDefined();
  });
});
