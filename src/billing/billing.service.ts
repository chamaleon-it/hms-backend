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
import { UsersService } from 'src/users/users.service';
import { AddPaymentDto } from './dto/add-payment.dto';
import { MarkAsPaidDto } from './dto/mark-as-paind.dto';

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
    @InjectModel(BillingItem.name) private billingItemModel: Model<BillingItem>,
    private readonly usersService: UsersService,
  ) { }

  private async generateUniqueMRN(prefix: string): Promise<string> {
    let mrn: string;
    let exists = true;

    do {
      const randomNum = Math.floor(1000000 + Math.random() * 9000000);
      mrn = `${prefix}${randomNum}`;

      // Check if MRN already exists
      const existing = await this.billingModel.exists({ mrn });
      exists = !!existing;
    } while (exists);

    return mrn;
  }

  async generateBill(createBill: CreateBillingDto) {
    const prefix = await this.usersService.getPharmacyBillingPrefix(
      createBill.user,
    );
    createBill.mrn = await this.generateUniqueMRN(prefix);
    const data = await this.billingModel.create(createBill);
    return data;
  }

  async getBills(user: mongoose.Types.ObjectId, getBillisDto: GetBillisDto) {
    const { q, method, status, date } = getBillisDto;

    const filter: {
      user?: mongoose.Types.ObjectId;
      mrn?: Record<string, string>;
      createdAt?: Record<string, Date>;
      cash?: Record<string, number>;
      insurance?: Record<string, number>;
      online?: Record<string, number>;
    } = {};

    filter.user = user;

    if (q) {
      filter.mrn = {
        $regex: '^' + q,
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
      .find(
        filter,
      )
      .populate('patient')
      .populate('patient.doctor')
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean()
      .exec();

    if (!status) return data;
    else {
      if (status === 'Unpaid') {
        data = data.filter((d) => !(d.insurance + d.cash + d.online + (d.discount ?? 0)));
      } else if (status === 'Paid') {
        data = data.filter(
          (d) =>
            (d.items.reduce((a, b) => a + b.total, 0)) <=
            (d.insurance + d.cash + d.online + (d.discount ?? 0)),
        );
      } else if (status === 'Partial') {
        data = data.filter(
          (d) =>
            d.items.reduce((a, b) => a + b.total, 0) >
            ((d.insurance + d.cash + d.online + (d.discount ?? 0) + (d.roundOff ? 1 : 0))) &&
            Boolean(d.insurance + d.cash + d.online + (d.discount ?? 0)),
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
      .populate('items')
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

  async addPayment(id: mongoose.Types.ObjectId, addPaymentDto: AddPaymentDto, user: mongoose.Types.ObjectId) {
    const data = await this.billingModel.findOneAndUpdate({ _id: id }, { $set: { cash: addPaymentDto.cash, insurance: addPaymentDto.insurance, online: addPaymentDto.online } }, { new: true });
    if (!data) throw new NotFoundException('Bill is not found.');
    return data;
  }

  async markAsPaid(id: mongoose.Types.ObjectId, markAsPaidDto: MarkAsPaidDto) {
    const data = await this.billingModel.findOneAndUpdate({ _id: id }, { $inc: { cash: markAsPaidDto.amount } }, { new: true });
    if (!data) throw new NotFoundException('Bill is not found.');
    return data;
  }
}
