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
import { Order, PaymentStatus } from 'src/pharmacy/orders/schemas/order.schema';
import { UpdateBillingItemDto } from './dto/update-billing-item.dto';

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
    @InjectModel(BillingItem.name) private billingItemModel: Model<BillingItem>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private readonly usersService: UsersService,
  ) { }

  private async generateUniqueMRN(prefix: string): Promise<string> {
    const lastRecord = await this.billingModel
      .findOne({ mrn: { $regex: `^${prefix}` } })
      .collation({ locale: 'en_US', numericOrdering: true })
      .sort({ mrn: -1 })
      .select('mrn')
      .lean()
      .exec();

    if (lastRecord && lastRecord.mrn) {
      const match = lastRecord.mrn.match(new RegExp(`^${prefix}(\\d+)$`));
      if (match && match[1]) {
        const nextNumber = parseInt(match[1], 10) + 1;
        return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
      }
    }

    return `${prefix}0001`;
  }

  async generateBill(createBill: CreateBillingDto) {
    const prefix = await this.usersService.getPharmacyBillingPrefix(
      createBill.user,
    );
    createBill.mrn = await this.generateUniqueMRN(prefix);
    const data = await this.billingModel.create(createBill);
    if (createBill.rxId) {
      const order: any = await this.orderModel
        .findOne({ mrn: createBill.rxId })
        .populate('items.name');
      if (order) {
        order.billNo = data.mrn;
        const paidAmount =
          (createBill.cash ?? 0) +
          (createBill.online ?? 0) +
          (createBill.insurance ?? 0) +
          (createBill.discount ?? 0);
        order.paidAmount =
          paidAmount >=
            order.items.reduce(
              (total, item) => total + item.quantity * item.name.unitPrice,
              0,
            )
            ? order.items.reduce(
              (total, item) => total + item.quantity * item.name.unitPrice,
              0,
            )
            : paidAmount;
        if (paidAmount === 0) {
          order.paymentStatus = PaymentStatus.Pending;
        } else if (
          paidAmount <
          order.items.reduce(
            (total, item) => total + item.quantity * item.name.unitPrice,
            0,
          )
        ) {
          order.paymentStatus = PaymentStatus.Partial;
        } else if (
          paidAmount >=
          order.items.reduce(
            (total, item) => total + item.quantity * item.name.unitPrice,
            0,
          )
        ) {
          order.paymentStatus = PaymentStatus.Paid;
        }
        await order.save();
      }
    }
    return data;
  }

  async getBills(user: mongoose.Types.ObjectId, getBillisDto: GetBillisDto) {
    const { page = 1, limit = 10, q, qEnd, method, status, startDate, endDate, activeDate } = getBillisDto;
    const skip = (page - 1) * limit;

    const pipeline: any[] = [];

    const match: any = { user: new mongoose.Types.ObjectId(user) };
    const qEndFound = await this.billingModel.exists({ mrn: qEnd?.toUpperCase() });

    if (q && qEnd && qEndFound) {
      match.mrn = { $gte: q.toUpperCase(), $lte: qEnd.toUpperCase() };
    }
    // else if (q) {
    //   match.mrn = { $regex: '^' + q, $options: 'i' };
    // }

    if (!q && startDate && endDate) {
      match.createdAt = { $gte: startDate, $lte: endDate };
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
          $match: {
            $expr: {
              $lte: [
                '$itemsTotal',
                {
                  $add: ['$totalPaid', { $cond: ['$roundOff', 1, 0] }],
                },
              ],
            },
          },
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
                      $add: ['$totalPaid', { $cond: ['$roundOff', 1, 0] }],
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
          ...(activeDate === 'Today' ? [] : [{ $skip: skip }, { $limit: limit }]),
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
      code: addBillingItemDto.code,
    });

    if (isExist) {
      throw new BadRequestException('Item code already exists in billing items.');
    }
    const data = await this.billingItemModel.create({
      user,
      ...addBillingItemDto,
    });
    return data;
  }

  async updateBillingItem(
    id: mongoose.Types.ObjectId,
    updateBillingItemDto: UpdateBillingItemDto,
    user: mongoose.Types.ObjectId,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Invalid billing item ID');
    }

    if (updateBillingItemDto.code) {
      const isExist = await this.billingItemModel.exists({
        user,
        code: updateBillingItemDto.code,
        _id: { $ne: id },
      });

      if (isExist) {
        throw new BadRequestException('Item code already exists in billing.');
      }
    }

    const data = await this.billingItemModel.findOneAndUpdate(
      { _id: id, user },
      updateBillingItemDto,
      { new: true },
    );

    if (!data) {
      throw new NotFoundException('Billing item not found');
    }

    return data;
  }

  async getBillingItems(
    { item }: GetBillingItemDto,
    user: mongoose.Types.ObjectId,
  ) {
    const filter: any = { user };

    if (item) {

      filter.$or = [
        { item: new RegExp(`^${item}`, 'i') },
        { code: new RegExp(`^${item}`, 'i') },
      ];
    }

    return this.billingItemModel.find(filter).lean().exec();
  }

  async deleteBillingItem(item: string, user: mongoose.Types.ObjectId) {
    const data = await this.billingItemModel.findOneAndDelete({ user, item });
    return data;
  }

  async addPayment(
    id: mongoose.Types.ObjectId,
    addPaymentDto: AddPaymentDto,
    user: mongoose.Types.ObjectId,
  ) {
    const data = await this.billingModel.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          cash: addPaymentDto.cash,
          insurance: addPaymentDto.insurance,
          online: addPaymentDto.online,
        },
      },
      { new: true },
    );
    if (!data) throw new NotFoundException('Bill is not found.');
    return data;
  }

  async markAsPaid(id: mongoose.Types.ObjectId, markAsPaidDto: MarkAsPaidDto) {
    const data = await this.billingModel.findOneAndUpdate(
      { _id: id },
      { $inc: { cash: markAsPaidDto.amount } },
      { new: true },
    );
    if (!data) throw new NotFoundException('Bill is not found.');
    return data;
  }
}
