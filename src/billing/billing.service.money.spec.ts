import { BadRequestException, ConflictException } from '@nestjs/common';
import { BillingService } from './billing.service';

describe('BillingService money rules', () => {
  const makeService = () => {
    const billingModel = {
      create: jest.fn(async (input) => input),
      db: {
        startSession: jest.fn(),
        collection: jest.fn(() => ({ findOne: jest.fn().mockResolvedValue({ _id: 'patient' }) })),
      },
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };
    const usersService = { getPharmacyBillingPrefix: jest.fn().mockResolvedValue('INV') };
    const service = new BillingService(
      billingModel as any,
      {} as any,
      {} as any,
      {} as any,
      usersService as any,
      { registerBootSeedJob: jest.fn() } as any,
    );
    (service as any).generateUniqueMRN = jest.fn().mockResolvedValue('INV0001');
    return { service, billingModel };
  };

  const bill = (overrides: Record<string, unknown> = {}) => ({
    patient: '507f1f77bcf86cd799439011' as any,
    user: '507f1f77bcf86cd799439012' as any,
    items: [{ name: 'Test', quantity: 2, unitPrice: 12.34, discount: 1.11, total: 23.57 }],
    cash: 20,
    online: 3.57,
    ...overrides,
  });

  it('uses calculated line totals and records the initial payment', async () => {
    const { service, billingModel } = makeService();
    await service.generateBill(bill() as any);
    expect(billingModel.create).toHaveBeenCalledWith(expect.objectContaining({
      mrn: 'INV0001',
      items: [expect.objectContaining({ total: 23.57 })],
      paymentEvents: [expect.objectContaining({ cashDelta: 20, onlineDelta: 3.57 })],
    }));
  });

  it('saves every submitted service line on a lab report bill', async () => {
    const { service, billingModel } = makeService();
    await service.generateBill(bill({
      reportId: '507f1f77bcf86cd799439014',
      items: [
        { name: 'Blood Test', quantity: 1, unitPrice: 100, total: 100 },
        { name: 'Consultation Fee', quantity: 1, unitPrice: 50, total: 50 },
      ],
      cash: 150,
      online: 0,
    }) as any);

    expect(billingModel.create).toHaveBeenCalledWith(expect.objectContaining({
      items: [
        expect.objectContaining({ name: 'Blood Test', total: 100 }),
        expect.objectContaining({ name: 'Consultation Fee', total: 50 }),
      ],
      reportId: '507f1f77bcf86cd799439014',
    }));
  });

  it('saves all pharmacy order lines before the order is completed', async () => {
    const { service, billingModel } = makeService();
    const session = {
      withTransaction: async (callback: () => Promise<void>) => callback(),
      endSession: jest.fn(),
    };
    billingModel.db.startSession.mockResolvedValue(session);
    billingModel.create.mockImplementation(async (input: any) => input);
    const orderModel = {
      findOneAndUpdate: jest.fn().mockResolvedValue({ patient: bill().patient }),
    };
    (service as any).orderModel = orderModel;
    jest.spyOn(service as any, 'syncLinkedOrderPayment').mockResolvedValue(undefined);

    await service.generateBill(bill({
      rxId: 'RX3',
      items: [
        { name: 'Medicine', quantity: 1, unitPrice: 27, total: 27 },
        { name: 'Consultation Fee', quantity: 1, unitPrice: 100, total: 100 },
        { name: 'Procedure', quantity: 1, unitPrice: 50, total: 50 },
      ],
      cash: 177,
      online: 0,
    }) as any);

    expect(billingModel.create).toHaveBeenCalledWith([
      expect.objectContaining({
        items: [
          expect.objectContaining({ name: 'Medicine', total: 27 }),
          expect.objectContaining({ name: 'Consultation Fee', total: 100 }),
          expect.objectContaining({ name: 'Procedure', total: 50 }),
        ],
      }),
    ], { session });
    expect(orderModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
  });

  it('returns the saved invoice for a repeated request ID', async () => {
    const { service, billingModel } = makeService();
    const saved = { mrn: 'INV0001' };
    billingModel.findOne.mockReturnValue({ session: async () => saved });
    const result = await service.generateBill(bill({
      clientRequestId: '06d8d9bd-729c-456c-a355-6eb763780c62',
    }) as any);
    expect(result).toBe(saved);
    expect(billingModel.create).not.toHaveBeenCalled();
  });

  it.each([
    [{ items: [] }, 'at least one item'],
    [{ items: [{ name: 'Test', quantity: 1, unitPrice: 10, total: 1 }] }, 'does not match'],
    [{ cash: 24 }, 'exceeds the bill total'],
    [{ discount: 30 }, 'Discount exceeds'],
  ])('rejects invalid bill amounts before writing', async (overrides, message) => {
    const { service, billingModel } = makeService();
    await expect(service.generateBill(bill(overrides) as any)).rejects.toThrow(message);
    expect(billingModel.create).not.toHaveBeenCalled();
  });

  it('rejects a stale payment update instead of overwriting a newer one', async () => {
    const { service, billingModel } = makeService();
    const session = {
      withTransaction: async (callback: () => Promise<void>) => callback(),
      endSession: jest.fn(),
    };
    billingModel.db.startSession.mockResolvedValue(session);
    billingModel.findOne.mockReturnValue({
      session: async () => ({
        items: [{ total: 100 }], cash: 20, online: 0, card: 0,
        refund: 0, discount: 0, transactionType: 'Sale',
        paymentEvents: [], updatedAt: new Date(),
      }),
    });
    billingModel.findOneAndUpdate.mockResolvedValue(null);
    await expect(service.addPayment(
      '507f1f77bcf86cd799439013' as any,
      { cash: 30, online: 0 },
      '507f1f77bcf86cd799439012' as any,
    )).rejects.toBeInstanceOf(ConflictException);
    expect(session.endSession).toHaveBeenCalled();
  });

  it('saves expenses and remarks without changing the payment amounts', async () => {
    const { service, billingModel } = makeService();
    const session = {
      withTransaction: async (callback: () => Promise<void>) => callback(),
      endSession: jest.fn(),
    };
    billingModel.db.startSession.mockResolvedValue(session);
    billingModel.findOne.mockReturnValue({
      session: async () => ({
        items: [{ total: 100 }], cash: 20, online: 0, card: 0,
        refund: 0, discount: 0, transactionType: 'Sale',
        paymentEvents: [], updatedAt: new Date(),
      }),
    });
    billingModel.findOneAndUpdate.mockResolvedValue({ items: [{ total: 100 }] });
    jest.spyOn(service as any, 'syncLinkedOrderPayment').mockResolvedValue(undefined);

    await service.addPayment(
      '507f1f77bcf86cd799439013' as any,
      { cash: 20, online: 0, expense: 15, remarks: '  Courier  ' },
      '507f1f77bcf86cd799439012' as any,
    );

    expect(billingModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ $set: expect.objectContaining({
        cash: 20, expense: 15, remarks: 'Courier',
      }) }),
      expect.anything(),
    );
  });

  it('treats a fully collected, partially refunded bill as paid', async () => {
    const { service, billingModel } = makeService();
    const session = {
      withTransaction: async (callback: () => Promise<void>) => callback(),
      endSession: jest.fn(),
    };
    billingModel.db.startSession.mockResolvedValue(session);
    billingModel.findOne.mockReturnValue({
      session: async () => ({
        mrn: 'INV0001', items: [{ total: 50 }], cash: 50, online: 0,
        card: 0, refund: 25, discount: 0, transactionType: 'Sale',
      }),
    });

    await expect(service.markAsPaid(
      '507f1f77bcf86cd799439013' as any,
      '507f1f77bcf86cd799439012' as any,
    )).rejects.toThrow('no remaining balance');
    expect(billingModel.findOneAndUpdate).not.toHaveBeenCalled();

    const orderModel = { findOneAndUpdate: jest.fn() };
    (service as any).orderModel = orderModel;
    await (service as any).syncLinkedOrderPayment({
      mrn: 'INV0001', items: [{ total: 50 }], cash: 50, online: 0,
      card: 0, refund: 25, discount: 0, transactionType: 'Sale',
    });
    expect(orderModel.findOneAndUpdate).toHaveBeenCalledWith(
      { billNo: 'INV0001' },
      { $set: { paidAmount: 25, paymentStatus: 'Paid' } },
      { session: undefined },
    );
  });
});
