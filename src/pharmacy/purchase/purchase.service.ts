import { Injectable } from '@nestjs/common';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Purchase } from './schemas/purchase.schema';
import { Model } from 'mongoose';
import { FindAllPurchaseDto } from './dto/find-all-purchase.dto';
import {
  COUNTER_KEYS,
  CountersService,
} from 'src/counters/counters.service';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectModel(Purchase.name) private purchaseModel: Model<Purchase>,
    private readonly countersService: CountersService,
  ) {
    this.countersService.registerBootSeed(COUNTER_KEYS.PHARMACY_PURCHASE, () =>
      this.maxPurchaseSeq(),
    );
  }

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

  private async maxPurchaseSeq(): Promise<number> {
    const last = await this.purchaseModel
      .findOne({ mrn: { $regex: /^RXW\d+$/ } })
      .collation({ locale: 'en_US', numericOrdering: true })
      .sort({ mrn: -1 })
      .select('mrn')
      .lean()
      .exec();
    if (!last?.mrn) return 0;
    const match = String(last.mrn).match(/^RXW(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private async generateUniqueMRN(): Promise<string> {
    return this.countersService.nextFormatted(COUNTER_KEYS.PHARMACY_PURCHASE, {
      prefix: 'RXW',
      pad: 7,
      getInitialMax: () => this.maxPurchaseSeq(),
    });
  }
}
