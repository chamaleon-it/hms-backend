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

describe('OrdersService.updateOrder before completion', () => {
  const id = new mongoose.Types.ObjectId();
  const itemId = new mongoose.Types.ObjectId();
  const current: any = {
    _id: id,
    status: 'Pending',
    updatedAt: new Date(),
    items: [{ name: itemId, quantity: 10, batchId: null, batchNumber: null }],
  };
  const makeService = () => {
    const service: any = Object.create(OrdersService.prototype);
    service.orderModel = {
      findById: jest.fn().mockReturnValue({ lean: () => ({ exec: async () => current }) }),
      findOneAndUpdate: jest.fn().mockImplementation((_filter, payload) => ({
        lean: async () => ({ ...current, ...payload }),
      })),
    };
    return service;
  };

  it('allows quantity edits without changing status or payment', async () => {
    const service = makeService();
    await service.updateOrder({
      _id: id,
      items: [{ name: { _id: itemId }, quantity: 20 }],
      status: 'Completed',
      paidAmount: 100,
      billNo: 'OTHER',
    } as any);
    const payload = service.orderModel.findOneAndUpdate.mock.calls[0][1];
    expect(payload.items[0].quantity).toBe(20);
    expect(payload).not.toHaveProperty('status');
    expect(payload).not.toHaveProperty('paidAmount');
    expect(payload).not.toHaveProperty('billNo');
  });

  it('allows adding another item while pending', async () => {
    const service = makeService();
    const result = await service.updateOrder({
      _id: id,
      items: [
        { name: { _id: itemId }, quantity: 10 },
        { name: { _id: new mongoose.Types.ObjectId() }, quantity: 1 },
      ],
    } as any);
    expect(result.items).toHaveLength(2);
  });

  it('rejects edits after completion', async () => {
    const service = makeService();
    service.orderModel.findById.mockReturnValue({
      lean: () => ({ exec: async () => ({ ...current, status: 'Completed' }) }),
    });
    await expect(service.updateOrder({
      _id: id,
      items: [{ name: { _id: itemId }, quantity: 20 }],
    } as any)).rejects.toBeInstanceOf(BadRequestException);
    expect(service.orderModel.findOneAndUpdate).not.toHaveBeenCalled();
  });
});

describe('OrdersService.completeOrder', () => {
  it('keeps consultation and procedure lines on a linked bill when completing', async () => {
    const id = new mongoose.Types.ObjectId();
    const patient = new mongoose.Types.ObjectId();
    const itemId = new mongoose.Types.ObjectId();
    const billId = new mongoose.Types.ObjectId();
    const session = {
      withTransaction: jest.fn(async (work: () => Promise<void>) => work()),
      endSession: jest.fn(),
    };
    const order: any = {
      _id: id, patient, mrn: 'RX3', billNo: 'INV3', status: 'Completed',
      discount: 0,
      items: [{ name: itemId, quantity: 1, batchSellingPrice: 27 }],
      save: jest.fn(),
    };
    const existingBill: any = {
      _id: billId, patient,
      items: [
        { name: 'Medicine', itemId, quantity: 1, unitPrice: 35, total: 35 },
        { name: 'Consultation Fee', quantity: 1, unitPrice: 100, total: 100 },
        { name: 'Procedure', quantity: 1, unitPrice: 50, total: 50 },
      ],
      cash: 177, online: 0, card: 0, refund: 0,
    };
    const service: any = Object.create(OrdersService.prototype);
    service.orderModel = {
      db: { startSession: jest.fn().mockResolvedValue(session) },
      findById: jest.fn().mockReturnValue({ exec: async () => ({ ...order, status: 'Pending' }) }),
      findOneAndUpdate: jest.fn().mockReturnValue({ exec: async () => order }),
    };
    service.billingModel = {
      findOne: jest.fn().mockReturnValue({ session: () => ({ exec: async () => existingBill }) }),
      findOneAndUpdate: jest.fn().mockResolvedValue(existingBill),
    };
    service.usersService = { getPharmacyBilling: jest.fn().mockResolvedValue({ autoGenerateBill: false }) };
    service.saleContext = jest.fn().mockResolvedValue({ orderId: id, orderNumber: 'RX3' });
    service.itemsService = {
      ensurePersistedBatchIds: jest.fn(),
      resolveBatchForSale: jest.fn().mockResolvedValue(null),
      decreaseItem: jest.fn().mockResolvedValue({}),
      getItem: jest.fn().mockResolvedValue({ name: 'Medicine' }),
    };

    await service.completeOrder(id, new mongoose.Types.ObjectId());

    const update = service.billingModel.findOneAndUpdate.mock.calls[0][1];
    expect(update.$set.items.map((item: any) => item.name)).toEqual([
      'Medicine', 'Consultation Fee', 'Procedure',
    ]);
    expect(update.$set.items[0]).toEqual(expect.objectContaining({ unitPrice: 27, total: 27 }));
    expect(order.paidAmount).toBe(177);
    expect(order.paymentStatus).toBe('Paid');
    expect(order.save).toHaveBeenCalledWith({ session });
  });

  it('reduces all item quantities only when completing the order', async () => {
    const id = new mongoose.Types.ObjectId();
    const itemId = new mongoose.Types.ObjectId();
    const session = {
      withTransaction: jest.fn(async (work: () => Promise<void>) => work()),
      endSession: jest.fn(),
    };
    const order: any = {
      _id: id,
      patient: new mongoose.Types.ObjectId(),
      mrn: 'RX1',
      status: 'Completed',
      items: [{ name: itemId, quantity: 10, batchId: 'B1', batchNumber: 'B1' }],
      save: jest.fn(),
    };
    const service: any = Object.create(OrdersService.prototype);
    service.orderModel = {
      db: { startSession: jest.fn().mockResolvedValue(session) },
      findById: jest.fn().mockReturnValue({ exec: async () => ({ ...order, status: 'Pending' }) }),
      findOneAndUpdate: jest.fn().mockReturnValue({ exec: async () => order }),
    };
    service.saleContext = jest.fn().mockResolvedValue({ orderId: id, orderNumber: 'RX1' });
    service.itemsService = {
      ensurePersistedBatchIds: jest.fn(),
      resolveBatchForSale: jest.fn().mockResolvedValue({ batchId: 'B1', batchNumber: 'B1' }),
      decreaseItem: jest.fn().mockResolvedValue({}),
    };

    await service.completeOrder(id);
    expect(session.withTransaction).toHaveBeenCalledTimes(1);
    expect(service.itemsService.decreaseItem).toHaveBeenCalledWith(
      itemId, 10, undefined, 'B1', 'B1',
      expect.objectContaining({ saleKey: `${id}:0` }), session,
    );
    expect(order.save).toHaveBeenCalledWith({ session });
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  it('does not deduct stock again when an order is already complete', async () => {
    const id = new mongoose.Types.ObjectId();
    const session = {
      withTransaction: jest.fn(async (work: () => Promise<void>) => work()),
      endSession: jest.fn(),
    };
    const service: any = Object.create(OrdersService.prototype);
    service.orderModel = {
      db: { startSession: jest.fn().mockResolvedValue(session) },
      findOneAndUpdate: jest.fn().mockReturnValue({ exec: async () => null }),
      findById: jest.fn().mockReturnValue({
        exec: async () => ({ _id: id, status: 'Completed' }),
      }),
    };
    service.itemsService = { decreaseItem: jest.fn() };

    await service.completeOrder(id);
    expect(service.itemsService.decreaseItem).not.toHaveBeenCalled();
  });

  it('does not finish when an item deduction fails', async () => {
    const id = new mongoose.Types.ObjectId();
    const itemId = new mongoose.Types.ObjectId();
    const session = {
      withTransaction: jest.fn(async (work: () => Promise<void>) => work()),
      endSession: jest.fn(),
    };
    const order: any = {
      _id: id,
      patient: new mongoose.Types.ObjectId(),
      mrn: 'RX2',
      items: [{ name: itemId, quantity: 10 }],
      save: jest.fn(),
    };
    const service: any = Object.create(OrdersService.prototype);
    service.orderModel = {
      db: { startSession: jest.fn().mockResolvedValue(session) },
      findById: jest.fn().mockReturnValue({ exec: async () => ({ ...order, status: 'Pending' }) }),
      findOneAndUpdate: jest.fn().mockReturnValue({ exec: async () => order }),
    };
    service.saleContext = jest.fn().mockResolvedValue({ orderId: id, orderNumber: 'RX2' });
    service.itemsService = {
      ensurePersistedBatchIds: jest.fn(),
      resolveBatchForSale: jest.fn().mockResolvedValue(null),
      decreaseItem: jest.fn().mockRejectedValue(new BadRequestException('Insufficient stock')),
    };

    await expect(service.completeOrder(id)).rejects.toThrow(/Insufficient stock/);
    expect(order.save).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });
});
