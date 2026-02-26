import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Supplier } from './schemas/supplier.schema';
import { RegisterSupplierDto } from './dto/register-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name) private supplierModel: Model<Supplier>,
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
  getIdAndName() {
    return this.supplierModel
      .find({ isDeleted: false })
      .select({ name: 1, _id: 1 })
      .exec();
  }
}
