import { BadRequestException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SupplierStatus } from './schemas/supplier.schema';

describe('SuppliersService deleteOrDeactivate', () => {
  function makeService(deps: {
    purchaseCount: number;
    outstanding: number;
    totalPaid?: number;
  }) {
    const svc: any = Object.create(SuppliersService.prototype);
    const supplier = {
      _id: 's1',
      name: 'Acme',
      isDeleted: false,
      status: SupplierStatus.ACTIVE,
    };
    svc.supplierModel = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(supplier),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          ...supplier,
          isDeleted: true,
          status: SupplierStatus.INACTIVE,
        }),
      }),
      findByIdAndDelete: jest.fn().mockResolvedValue(supplier),
    };
    const entries = Array.from({ length: deps.purchaseCount }).map(() => ({
      total: deps.outstanding + (deps.totalPaid || 0),
      paidAmount: deps.totalPaid || 0,
    }));
    // Adjust so outstanding matches
    if (deps.purchaseCount === 1) {
      entries[0] = {
        total: deps.outstanding + (deps.totalPaid || 0),
        paidAmount: deps.totalPaid || 0,
      };
    }
    svc.purchaseEntryModel = {
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(entries),
      }),
    };
    return svc as SuppliersService & { supplierModel: any };
  }

  it('hard-deletes when no purchase history', async () => {
    const svc = makeService({ purchaseCount: 0, outstanding: 0 });
    const result = await svc.deleteOrDeactivate('s1', 'auto');
    expect(result.action).toBe('hard_deleted');
    expect((svc as any).supplierModel.findByIdAndDelete).toHaveBeenCalled();
  });

  it('soft-deactivates when purchase history exists', async () => {
    const svc = makeService({ purchaseCount: 2, outstanding: 50, totalPaid: 10 });
    const result = await svc.deleteOrDeactivate('s1', 'auto');
    expect(result.action).toBe('deactivated');
    expect((svc as any).supplierModel.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('blocks forced hard delete with history', async () => {
    const svc = makeService({ purchaseCount: 1, outstanding: 20 });
    await expect(svc.deleteOrDeactivate('s1', 'hard')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
