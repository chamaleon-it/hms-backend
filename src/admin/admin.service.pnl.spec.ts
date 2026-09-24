import { BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';

describe('AdminService.getProfitAndLoss', () => {
  let service: AdminService;
  let billingModel: { aggregate: jest.Mock; countDocuments: jest.Mock };
  let itemModel: { aggregate: jest.Mock };
  let consumableIssueModel: { aggregate: jest.Mock };

  beforeEach(() => {
    billingModel = {
      aggregate: jest.fn(),
      countDocuments: jest.fn(),
    };
    itemModel = { aggregate: jest.fn() };
    consumableIssueModel = { aggregate: jest.fn() };

    service = new AdminService(
      {} as any,
      billingModel as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      itemModel as any,
      consumableIssueModel as any,
    );
  });

  it('rejects invalid dates', async () => {
    await expect(
      service.getProfitAndLoss('not-a-date', 'also-bad'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('computes gross and net profit without inventing expenses', async () => {
    billingModel.aggregate.mockResolvedValue([
      {
        totalCash: 1000,
        totalOnline: 500,
        totalDiscount: 50,
        pharmacyRevenue: 1200,
        labRevenue: 300,
      },
    ]);
    itemModel.aggregate.mockResolvedValue([
      { cogs: 400, unitsSold: 20, salesValue: 900 },
    ]);
    consumableIssueModel.aggregate.mockResolvedValue([
      { totalCost: 100, quantity: 5 },
    ]);
    billingModel.countDocuments.mockResolvedValue(12);

    const result = await service.getProfitAndLoss(
      '2026-01-01',
      '2026-01-31',
    );

    expect(result.revenue.total).toBe(1500);
    expect(result.costs.cogs).toBe(400);
    expect(result.costs.consumables).toBe(100);
    expect(result.costs.note).toMatch(/No other operating expenses/i);
    expect(result.profit.grossProfit).toBe(1100);
    expect(result.profit.netProfit).toBe(1000);
  });
});
