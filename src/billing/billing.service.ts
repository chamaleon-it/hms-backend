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
    const { page = 1, limit = 10, q, method, status, date } = getBillisDto;
    const skip = (page - 1) * limit;

    const pipeline: any[] = [];

    const match: any = { user: new mongoose.Types.ObjectId(user) };

    if (q) {
      match.mrn = { $regex: '^' + q, $options: 'i' };
    }

    if (date) {
      const from = new Date(date);
      if (isNaN(from.getTime())) {
        throw new BadRequestException('Invalid date');
      }
      const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
      match.createdAt = { $gte: from, $lt: to };
    }

    if (method) {
      if (method === 'Cash') {
        match.cash = { $ne: 0 };
      } else if (method === 'Insurance') {
        match.insurance = { $ne: 0 };
      } else if (method === 'Online') {
        match.online = { $ne: 0 };
      }
    }

    pipeline.push({ $match: match });

    // Add calculations for status filtering
    pipeline.push({
      $addFields: {
        itemsTotal: { $sum: '$items.total' },
        totalPaid: {
          $add: [
            '$cash',
            '$online',
            '$insurance',
            { $ifNull: ['$discount', 0] },
          ],
        },
      },
    });

    if (status) {
      if (status === 'Unpaid') {
        pipeline.push({ $match: { totalPaid: 0 } });
      } else if (status === 'Paid') {
        pipeline.push({
          $match: { $expr: { $lte: ['$itemsTotal', '$totalPaid'] } },
        });
      } else if (status === 'Partial') {
        pipeline.push({
          $match: {
            $and: [
              {
                $expr: {
                  $gt: [
                    '$itemsTotal',
                    {
                      $add: [
                        '$totalPaid',
                        { $cond: ['$roundOff', 1, 0] },
                      ],
                    },
                  ],
                },
              },
              { totalPaid: { $gt: 0 } },
            ],
          },
        });
      }
    }

    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'patients',
              localField: 'patient',
              foreignField: '_id',
              as: 'patient',
            },
          },
          { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'users',
              localField: 'patient.doctor',
              foreignField: '_id',
              as: 'patient.doctor',
            },
          },
          {
            $unwind: {
              path: '$patient.doctor',
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
      },
    });

    const result = await this.billingModel.aggregate(pipeline).exec();

    const data = result[0].data;
    const total = result[0].metadata[0]?.total ?? 0;

    return { data, total };
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
