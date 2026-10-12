import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { Order } from './schemas/order.schema';
import { Patient } from 'src/patients/schemas/patient.schema';
import { Billing } from 'src/billing/schemas/billing.schema';
import { ItemsService } from '../items/items.service';
import { BillingService } from 'src/billing/billing.service';
import { UsersService } from 'src/users/users.service';

describe('OrdersService since filter', () => {
  let service: OrdersService;
  let captured: Record<string, unknown> | undefined;

  beforeEach(async () => {
    const chain: Record<string, jest.Mock> = {};
    const self = () => chain;
    for (const method of ['sort', 'skip', 'limit', 'populate']) {
      chain[method] = jest.fn(self);
    }
    chain.exec = jest.fn().mockResolvedValue([]);

    const orderModel = {
      find: jest.fn((filter: Record<string, unknown>) => {
        captured = filter;
        return chain;
      }),
      countDocuments: jest.fn(async (filter: Record<string, unknown>) => {
        captured = filter;
        return 3;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: getModelToken(Patient.name), useValue: {} },
        { provide: getModelToken(Billing.name), useValue: {} },
        { provide: ItemsService, useValue: {} },
        { provide: BillingService, useValue: {} },
        { provide: UsersService, useValue: {} },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  it('counts non-deleted orders created strictly after since', async () => {
    const since = new Date('2026-10-12T10:00:00.000Z');
    const result = await service.getOrders({ since, page: 1, limit: 1 });

    expect(result.total).toBe(3);
    expect(captured).toEqual({
      createdAt: { $gt: since },
      isDeleted: false,
    });
  });
});
