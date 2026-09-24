import { BadRequestException } from '@nestjs/common';
import { BillingService } from './billing.service';

describe('BillingService.getReconsultEligibility', () => {
  let service: BillingService;
  let consultingModel: { findOne: jest.Mock };
  let userModel: { findById: jest.Mock };

  beforeEach(() => {
    consultingModel = {
      findOne: jest.fn(),
    };
    userModel = {
      findById: jest.fn(),
    };

    service = new BillingService(
      {} as any,
      {} as any,
      {} as any,
      consultingModel as any,
      userModel as any,
      {} as any,
    );
  });

  it('throws on invalid patientId', async () => {
    await expect(
      service.getReconsultEligibility('not-an-id'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns not eligible when no prior consult', async () => {
    userModel.findById.mockReturnValue({
      select: () => ({
        lean: () =>
          Promise.resolve({
            pharmacy: { billing: { freeReconsultDays: 7 } },
          }),
      }),
    });
    consultingModel.findOne.mockReturnValue({
      sort: () => ({
        select: () => ({
          lean: () => Promise.resolve(null),
        }),
      }),
    });

    const patientId = '507f1f77bcf86cd799439011';
    const pharmacyId = '507f1f77bcf86cd799439012' as any;
    const result = await service.getReconsultEligibility(
      patientId,
      undefined,
      pharmacyId,
    );

    expect(result.eligible).toBe(false);
    expect(result.freeDays).toBe(7);
    expect(result.suggestedFee).toBeNull();
  });

  it('returns eligible when last consult is within free window', async () => {
    userModel.findById.mockReturnValue({
      select: () => ({
        lean: () =>
          Promise.resolve({
            pharmacy: { billing: { freeReconsultDays: 10 } },
          }),
      }),
    });

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    consultingModel.findOne.mockReturnValue({
      sort: () => ({
        select: () => ({
          lean: () =>
            Promise.resolve({
              createdAt: threeDaysAgo,
              doctor: '507f1f77bcf86cd799439013',
            }),
        }),
      }),
    });

    const result = await service.getReconsultEligibility(
      '507f1f77bcf86cd799439011',
      undefined,
      '507f1f77bcf86cd799439012' as any,
    );

    expect(result.eligible).toBe(true);
    expect(result.suggestedFee).toBe(0);
    expect(result.freeDays).toBe(10);
  });

  it('returns not eligible when outside free window', async () => {
    userModel.findById.mockReturnValue({
      select: () => ({
        lean: () =>
          Promise.resolve({
            pharmacy: { billing: { freeReconsultDays: 7 } },
          }),
      }),
    });

    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

    consultingModel.findOne.mockReturnValue({
      sort: () => ({
        select: () => ({
          lean: () =>
            Promise.resolve({
              createdAt: twentyDaysAgo,
              doctor: '507f1f77bcf86cd799439013',
            }),
        }),
      }),
    });

    const result = await service.getReconsultEligibility(
      '507f1f77bcf86cd799439011',
      undefined,
      '507f1f77bcf86cd799439012' as any,
    );

    expect(result.eligible).toBe(false);
    expect(result.daysSinceLastConsult).toBeGreaterThan(7);
  });
});
