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
    const data = await this.purchaseModel.create(createPurchaseDto);
    return data;
  }

  async findAll(findAllPurchaseDto: FindAllPurchaseDto) {
    const { pharmacy, status, wholesaler } = findAllPurchaseDto;
    const limit = Number(findAllPurchaseDto.limit) ?? 100;
    const page = Number(findAllPurchaseDto.page) ?? 1;

    const query: any = {};
    if (pharmacy) query.pharmacy = pharmacy;
    if (status) query.status = status;
    if (wholesaler) query.wholesaler = wholesaler;

    const total = await this.purchaseModel.countDocuments(query);
    const data = await this.purchaseModel
      .find(query)
      .populate('wholesaler', 'name email phoneNumber address')
      .populate('pharmacy', 'name email phoneNumber address')
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
