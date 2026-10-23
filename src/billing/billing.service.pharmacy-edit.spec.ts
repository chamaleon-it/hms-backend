import mongoose from 'mongoose';
import { BillingService } from './billing.service';

describe('BillingService.editPharmacyBill', () => {
  const billId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const itemId = new mongoose.Types.ObjectId();
  const updatedAt = new Date('2026-10-23T09:00:00.000Z');

  const setup = () => {
    const session = {
      withTransaction: jest.fn(async (work: () => Promise<void>) => work()),
      endSession: jest.fn(),
    };
    const medicine = {
      name: 'Therapy Oil', itemId, batchId: null, batchNumber: null,
      quantity: 3, unitPrice: 12, discount: 0, total: 36,
    };
    const existing = {
      _id: billId, user: userId, mrn: 'INV7', status: 'Draft',
      items: [medicine, { name: 'Consultation Fee', quantity: 1, unitPrice: 150, discount: 0, total: 150 }],
      cash: 180, online: 0, card: 0, refund: 0, discount: 6,
      get: (key: string) => key === 'updatedAt' ? updatedAt : undefined,
    };
    const billingModel = {
      db: { startSession: jest.fn().mockResolvedValue(session) },
      findOne: jest.fn().mockReturnValue({ session: () => ({ exec: async () => existing }) }),
      findOneAndUpdate: jest.fn().mockResolvedValue(existing),
    };
    const orderModel = {
      findOne: jest.fn().mockReturnValue({ session: () => ({ exec: async () => ({ _id: new mongoose.Types.ObjectId() }) }) }),
      findOneAndUpdate: jest.fn().mockResolvedValue({}),
    };
    const service: any = Object.create(BillingService.prototype);
    service.billingModel = billingModel;
    service.orderModel = orderModel;
    service.syncLinkedOrderPayment = jest.fn();
    const dto = {
      items: [
        { ...medicine, itemId: String(itemId) },
        { name: 'Consultation Fee', quantity: 1, unitPrice: 160, discount: 0, total: 160 },
      ],
      discount: 16,
      doctor: 'Dr. Rashid',
      expectedUpdatedAt: updatedAt.toISOString(),
    };
    return { service, billingModel, orderModel, session, dto, medicine };
  };

  it('updates service lines and discount while preserving medicines and payments', async () => {
    const { service, billingModel, orderModel, dto, medicine } = setup();
    await service.editPharmacyBill(billId, dto, userId);

    const update = billingModel.findOneAndUpdate.mock.calls[0][1].$set;
    expect(update.items[0]).toBe(medicine);
    expect(update.items[1]).toEqual(expect.objectContaining({ name: 'Consultation Fee', total: 160 }));
    expect(update.discount).toBe(16);
    expect(update).not.toHaveProperty('cash');
    expect(orderModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(), { $set: { discount: 16, doctorName: 'Dr. Rashid' } }, expect.anything(),
    );
    expect(service.syncLinkedOrderPayment).toHaveBeenCalledTimes(1);
  });

  it('rejects an edit that would put recorded payments above the new total', async () => {
    const { service, billingModel, dto } = setup();
    dto.discount = 30;
    await expect(service.editPharmacyBill(billId, dto, userId)).rejects.toThrow(/Payment exceeds/);
    expect(billingModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('rejects medicine edits on bills linked to orders', async () => {
    const { service, billingModel, dto } = setup();
    dto.items[0].unitPrice = 10;
    dto.items[0].total = 30;
    await expect(service.editPharmacyBill(billId, dto, userId)).rejects.toThrow(/linked order/);
    expect(billingModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('rejects a stale edit instead of replacing newer changes', async () => {
    const { service, billingModel, dto } = setup();
    dto.expectedUpdatedAt = new Date('2026-10-22T09:00:00.000Z').toISOString();
    await expect(service.editPharmacyBill(billId, dto, userId)).rejects.toThrow(/changed while editing/);
    expect(billingModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('allows item edits on a bill without a linked order', async () => {
    const { service, billingModel, orderModel, dto } = setup();
    orderModel.findOne.mockReturnValue({ session: () => ({ exec: async () => null }) });
    dto.items[0].unitPrice = 15;
    dto.items[0].total = 45;
    dto.discount = 25;

    await service.editPharmacyBill(billId, dto, userId);

    const update = billingModel.findOneAndUpdate.mock.calls[0][1].$set;
    expect(update.items[0]).toEqual(expect.objectContaining({ unitPrice: 15, total: 45 }));
    expect(orderModel.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
