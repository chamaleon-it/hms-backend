import { Injectable } from '@nestjs/common';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Purchase } from './schemas/purchase.schema';
import { Model } from 'mongoose';
import { FindAllPurchaseDto } from './dto/find-all-purchase.dto';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectModel(Purchase.name) private purchaseModel: Model<Purchase>,
  ) {}

  async createPurchase(createPurchaseDto: CreatePurchaseDto) {
    const mrn = await this.generateUniqueMRN();
    const data = await this.purchaseModel.create({ ...createPurchaseDto, mrn });
    return data;
  }

  async findAll(findAllPurchaseDto: FindAllPurchaseDto) {
    const { pharmacy, status, wholesaler, mrn } = findAllPurchaseDto;
    const limit = Number(findAllPurchaseDto.limit ?? 100);
    const page = Number(findAllPurchaseDto.page ?? 1);

    const query: {
      pharmacy?: string;
      status?: string;
      wholesaler?: string;
      mrn?: Record<string, string>;
    } = {};
    if (pharmacy) query.pharmacy = pharmacy;
    if (status) query.status = status;
    if (wholesaler) query.wholesaler = wholesaler;
    if (mrn) query.mrn = { $regex: '^' + mrn, $options: 'i' };

    const total = await this.purchaseModel.countDocuments(query);
    const data = await this.purchaseModel
      .find(query)
      .populate('wholesaler', 'name email phoneNumber address')
      .populate('pharmacy', 'name email phoneNumber address')
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .lean();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  private async generateUniqueMRN(): Promise<string> {
    const prefix = 'PRC-';
    const lastRecord = await this.purchaseModel
      .findOne({ mrn: { $regex: `^${prefix}\\d+$` } })
      .collation({ locale: 'en_US', numericOrdering: true })
      .sort({ mrn: -1 })
      .select('mrn')
      .lean()
      .exec();

    let nextNumber = 1;
    if (lastRecord && lastRecord.mrn) {
      const match = lastRecord.mrn.match(new RegExp(`^${prefix}(\\d+)$`));
      if (match && match[1]) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    let mrn: string;
    let exists = true;
    do {
      mrn = `${prefix}${nextNumber.toString().padStart(5, '0')}`;
      const existing = await this.purchaseModel.exists({ mrn });
      exists = !!existing;
      if (exists) nextNumber++;
    } while (exists);

    return mrn;
  }
}
