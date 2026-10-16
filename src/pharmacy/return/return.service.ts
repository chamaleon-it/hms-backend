import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReturnDto } from './dto/create-return.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Return, ReturnReason } from './schemas/return.schema';
import mongoose, { Model } from 'mongoose';
import { ItemsService } from '../items/items.service';
import { Billing } from 'src/billing/schemas/billing.schema';
import { Order, OrderStatus } from '../orders/schemas/order.schema';

@Injectable()
export class ReturnService {
  constructor(
    @InjectModel(Return.name) private returnModel: Model<Return>,
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private readonly itemsService: ItemsService,
  ) { }

  async create(createReturnDto: CreateReturnDto) {
    if (!createReturnDto.items?.length) {
      throw new BadRequestException('Select at least one item to return.');
    }
    for (const item of createReturnDto.items) {
      if (!mongoose.isValidObjectId(item.name) || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new BadRequestException('Return items require a valid medicine and positive whole quantity.');
      }
    }
    // Legacy inventory can have batches without IDs. Heal before the transaction.
    for (const itemId of new Set(createReturnDto.items.map((item) => String(item.name)))) {
      await this.itemsService.ensurePersistedBatchIds(itemId);
    }
    const validReasonForQuantityAdd = [
      ReturnReason.AdverseReaction,
      ReturnReason.DoctorChangedRx,
      ReturnReason.NotRequired,
      ReturnReason.Other,
      ReturnReason.QualityIssue,
      ReturnReason.WrongItem,
    ];
    const session = await this.returnModel.db.startSession();
    let data: Return | undefined;
    try {
      await session.withTransaction(async () => {
        const order = await this.orderModel.findById(createReturnDto.order).session(session);
        if (!order || order.status !== OrderStatus.Completed || String(order.patient) !== String(createReturnDto.patient)) {
          throw new BadRequestException('Only items from a completed order can be returned.');
        }
        if (!order.billNo || order.billNo === '-' || (createReturnDto.billNo && createReturnDto.billNo !== order.billNo)) {
          throw new BadRequestException('The order bill number does not match.');
        }
        const originalBill = await this.billingModel.findOne({ mrn: order.billNo, transactionType: 'Sale' }).session(session);
        if (!originalBill) throw new BadRequestException('Original sale bill was not found.');
        const returnBillNo = `R-${order.billNo}`;
        if (await this.billingModel.exists({ mrn: returnBillNo }).session(session)) {
          throw new BadRequestException('This bill has already been returned.');
        }

        const ordered = new Map<string, number>();
        for (const line of order.items) {
          const key = String(line.name);
          ordered.set(key, (ordered.get(key) || 0) + line.quantity);
        }
        const returned = new Map<string, number>();
        const billItems: { name: string; itemId: mongoose.Types.ObjectId; quantity: number; unitPrice: number; total: number }[] = [];
        let refund = 0;
        for (const line of createReturnDto.items) {
          const key = String(line.name);
          const nextQuantity = (returned.get(key) || 0) + line.quantity;
          if (!ordered.has(key) || nextQuantity > ordered.get(key)!) {
            throw new BadRequestException('Return quantity exceeds the completed order.');
          }
          returned.set(key, nextQuantity);
          const originalLine = originalBill.items.find((entry) => String(entry.itemId) === key);
          const orderLine = order.items.find((entry) => String(entry.name) === key);
          const unitPrice = originalLine?.unitPrice ?? orderLine?.batchSellingPrice;
          if (unitPrice == null || !Number.isFinite(unitPrice) || unitPrice < 0) {
            throw new BadRequestException('The original sale price is unavailable for this item.');
          }
          const item = await this.itemsService.getItem(line.name);
          const total = unitPrice * line.quantity;
          refund += total;
          billItems.push({ name: item.name, itemId: line.name, quantity: line.quantity, unitPrice, total });
        }

        const [created] = await this.returnModel.create([{
          patient: order.patient,
          order: order._id,
          items: createReturnDto.items.map((line) => ({
            ...line,
            unitPrice: billItems.find((entry) => String(entry.itemId) === String(line.name))!.unitPrice,
          })),
          billNo: returnBillNo,
        }], { session });
        data = created;
        await this.billingModel.create([{
          patient: order.patient,
          user: originalBill.user,
          items: billItems,
          mrn: returnBillNo,
          salesMRN: order.billNo,
          transactionType: 'Return',
          cash: refund,
        }], { session });
        for (const line of createReturnDto.items) {
          if (validReasonForQuantityAdd.includes(line.reason!) || !line.reason) {
            await this.itemsService.increaseItem(line.name, line.quantity, session);
          }
        }
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new BadRequestException('This bill has already been returned.');
      }
      throw error;
    } finally {
      await session.endSession();
    }
    return data;
  }


  async findAll() {
    const data = await this.returnModel
      .find()
      .populate('patient', 'name phoneNumber email address mrn')
      .populate('order', 'mrn')
      .populate(
        'items.name',
        '-createdAt -updatedAt -expiryDate -purchasePrice ',
      )
      .lean()
      .exec();
    return data;
  }

  async findOne(id: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Please provide a valid return id');
    }
    const data = await this.returnModel
      .findById(id)
      .populate('patient', 'name phoneNumber email address mrn')
      .populate('order', 'mrn')
      .populate(
        'items.name',
        '-createdAt -updatedAt -expiryDate -purchasePrice ',
      )
      .lean()
      .exec();

    if (!data) {
      throw new NotFoundException(
        'Sorry no return data available for this id.',
      );
    }
    return data;
  }

  async findByPatient(patientId: string) {
    if (!mongoose.isValidObjectId(patientId)) {
      throw new BadRequestException('Please provide a valid patient id');
    }
    const data = await this.returnModel
      .find({ patient: patientId })
      // .populate('patient', 'name phoneNumber email address mrn')
      .populate('order', 'mrn')
      .populate(
        'items.name',
        '-createdAt -updatedAt -expiryDate -purchasePrice ',
      )
      .lean()
      .exec();

    return data;
  }
}
