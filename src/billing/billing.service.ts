import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBillingDto } from './dto/create-billing.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Billing } from './schemas/billing.schema';
import mongoose, { Model } from 'mongoose';
import { GetBillisDto } from './dto/get-bills.dto';
import { AddBillingItemDto } from './dto/add-billing-item.dto';
import { BillingItem } from './schemas/billingItem.schema';
import { GetBillingItemDto } from './dto/get-billing-item.dto';

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
    @InjectModel(BillingItem.name) private billingItemModel: Model<BillingItem>,
  ) {}

  private async generateUniqueMRN(): Promise<string> {
    let mrn: string;
    let exists = true;

    do {
      const randomNum = Math.floor(1000000 + Math.random() * 9000000);
      mrn = `INV${randomNum}`;

      // Check if MRN already exists
      const existing = await this.billingModel.exists({ mrn });
      exists = !!existing;
    } while (exists);

    return mrn;
  }

  async generateBill(createBill: CreateBillingDto) {
    createBill.mrn = await this.generateUniqueMRN();
    const data = await this.billingModel.create(createBill);
    return data;
  }

  async getBills(user: mongoose.Types.ObjectId, getBillisDto: GetBillisDto) {
    const { q, method, status, date } = getBillisDto;

    const filter: any = {};

    filter.user = user;

    if (q) {
      filter.mrn = {
        $regex: q,
        $options: 'i',
      };
    }

    if (date) {
      const from = new Date(date);
      if (isNaN(from.getTime())) {
        throw new BadRequestException('Invalid date');
      }
      const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
      filter.createdAt = { $gte: from, $lt: to };
    }

    if (method) {
      if (method === 'Cash') {
        filter.cash = { $ne: 0 };
      } else if (method === 'Insurance') {
        filter.insurance = { $ne: 0 };
      } else if (method === 'Online') {
        filter.online = { $ne: 0 };
      }
    }

    let data = await this.billingModel
      .find(filter, 'mrn createdAt patient items.total cash online insurance')
      .populate('patient', 'name mrn')
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean()
      .exec();

    if (!status) return data;
    else {
      if (status === 'Unpaid') {
        data = data.filter((d) => !(d.insurance + d.cash + d.online));
      } else if (status === 'Paid') {
        data = data.filter(
          (d) =>
            d.items.reduce((a, b) => a + b.total, 0) <=
            d.insurance + d.cash + d.online,
        );
      } else if (status === 'Partial') {
        data = data.filter(
          (d) =>
            d.items.reduce((a, b) => a + b.total, 0) >
              d.insurance + d.cash + d.online &&
            Boolean(d.insurance + d.cash + d.online),
        );
      }
    }

    return data;
  }

  async getBill(id: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id))
      throw new BadRequestException('Please provide a valid bill id');
    const data = await this.billingModel
      .findById(id)
      .populate('patient')
      .lean()
      .exec();
    if (!data) throw new NotFoundException('Bill is not found.');
    return data;
  }

  async addBillingItem(
    addBillingItemDto: AddBillingItemDto,
    user: mongoose.Types.ObjectId,
  ) {
    const isExist = await this.billingItemModel.exists({
      user,
      item: addBillingItemDto.item,
    });

    if (isExist) {
      throw new BadRequestException('Already added to billing.');
    }
    const data = await this.billingItemModel.create({
      user,
      item: addBillingItemDto.item,
    });
    return data;
  }

  async getBillingItems(
    { item }: GetBillingItemDto,
    user: mongoose.Types.ObjectId,
  ) {
    return this.billingItemModel
      .find({ user, item: new RegExp(item, 'i') })
      .limit(5)
      .distinct('item')
      .lean()
      .exec();
  }

  async deleteBillingItem(item: string, user: mongoose.Types.ObjectId) {
    const data = await this.billingItemModel.findOneAndDelete({ user, item });
    return data;
  }
}
