import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Supplier, SupplierStatus } from './schemas/supplier.schema';
import { RegisterSupplierDto } from './dto/register-supplier.dto';
import { UpdateSupplierDto } from './dto/update-suppllier.dto';
import { PurchaseEntry } from './purchase_entry/schemas/purchase-entry.schema';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name) private supplierModel: Model<Supplier>,
    @InjectModel(PurchaseEntry.name)
    private purchaseEntryModel: Model<PurchaseEntry>,
  ) {}

  async registerSupplier(dto: RegisterSupplierDto) {
    const supplier = new this.supplierModel(dto);
    return supplier.save();
  }

  async findAll() {
    return await this.supplierModel
      .aggregate([
        { $match: { isDeleted: false } },
        {
          $lookup: {
            from: 'purchaseentries',
            localField: '_id',
            foreignField: 'supplier',
            as: 'purchaseEntries',
          },
        },
        {
          $addFields: {
            totalPurchaseCount: { $size: '$purchaseEntries' },
            totalPurchaseValue: { $sum: '$purchaseEntries.total' },
            totalDue: {
              $subtract: [
                { $sum: '$purchaseEntries.total' },
                { $sum: '$purchaseEntries.paidAmount' },
              ],
            },
          },
        },
        {
          $project: {
            purchaseEntries: 0,
          },
        },
      ])
      .exec();
  }

  async findOne(id: string) {
    return await this.supplierModel.findById(id).exec();
  }

  getIdAndName(activeOnly = true) {
    const filter: any = { isDeleted: false };
    if (activeOnly) {
      filter.status = SupplierStatus.ACTIVE;
    }
    return this.supplierModel.find(filter).select({ name: 1, _id: 1 }).exec();
  }

  async updateSupplier(id: string, dto: UpdateSupplierDto) {
    return await this.supplierModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
  }

  async getDependencySummary(id: string) {
    const supplier = await this.supplierModel.findById(id).lean();
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    const entries = await this.purchaseEntryModel.find({ supplier: id }).lean();
    const purchaseCount = entries.length;
    const outstanding = entries.reduce(
      (sum, e) => sum + Math.max(0, (e.total || 0) - (e.paidAmount || 0)),
      0,
    );
    const totalPaid = entries.reduce((sum, e) => sum + (e.paidAmount || 0), 0);

    return {
      supplier,
      purchaseCount,
      outstanding: Math.round(outstanding * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      hasHistory: purchaseCount > 0 || totalPaid > 0,
    };
  }

  /**
   * Soft-delete/deactivate when purchase/payment history exists.
   * Hard delete only when zero dependencies.
   */
  async deleteOrDeactivate(id: string, mode?: 'soft' | 'hard' | 'auto') {
    const summary = await this.getDependencySummary(id);
    const resolvedMode =
      mode === 'hard' || mode === 'soft'
        ? mode
        : summary.hasHistory
          ? 'soft'
          : 'hard';

    if (resolvedMode === 'hard') {
      if (summary.hasHistory) {
        throw new BadRequestException(
          'Cannot hard-delete supplier with purchase or payment history. Deactivate instead.',
        );
      }
      await this.supplierModel.findByIdAndDelete(id);
      return {
        action: 'hard_deleted',
        message: 'Supplier permanently deleted (no purchase history).',
        ...summary,
      };
    }

    const updated = await this.supplierModel
      .findByIdAndUpdate(
        id,
        { isDeleted: true, status: SupplierStatus.INACTIVE },
        { new: true },
      )
      .lean();

    return {
      action: 'deactivated',
      message:
        'Supplier deactivated. Hidden from new selection; historical records retained.',
      supplier: updated,
      purchaseCount: summary.purchaseCount,
      outstanding: summary.outstanding,
    };
  }
}
