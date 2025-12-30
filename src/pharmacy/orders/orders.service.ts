import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderPriority, OrderStatus } from './schemas/order.schema';
import mongoose, { Model } from 'mongoose';
import { PackedDto } from './dto/packed.dto';
import { MarkAllAsPackedDto } from './dto/markAllAsPacked.dto copy';
import { ItemsService } from '../items/items.service';
import { UpdateOrderDto } from './dto/UpdateOrder.dto';
import { BillingService } from 'src/billing/billing.service';
import { UsersService } from 'src/users/users.service';
import configuration from 'src/config/configuration';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private readonly itemsService: ItemsService,
    private readonly billingService: BillingService,
    private readonly usersService: UsersService,
  ) { }

  private async generateUniqueMRN(): Promise<string> {
    let mrn: string;
    let exists = true;

    do {
      const randomNum = Math.floor(1000000 + Math.random() * 9000000);
      mrn = `RX${randomNum}`;
      const existing = await this.orderModel.exists({ mrn });
      exists = !!existing;
    } while (exists);

    return mrn;
  }

  async createOrder(order: CreateOrderDto) {
    const mrn = await this.generateUniqueMRN();
    order.mrn = mrn;
    const data = await this.orderModel.create(order);
    const { autoGenerateBill } = await this.usersService.getPharmacyBilling(configuration().in_house_pharmacy_id);
    if (autoGenerateBill) {
      const items = await Promise.all(
        order.items.map(async (item) => {
          const itemData = await this.itemsService.getItem(item.name);

          const unitPrice = itemData.unitPrice;
          const quantity = item.quantity;

          return {
            name: itemData.name,
            unitPrice,
            quantity,
            discount: 0,
            gst: 0,
            total: unitPrice * quantity,
          };
        })
      );

      await this.billingService.generateBill({
        patient: order.patient,
        items,
        user: new mongoose.Types.ObjectId(configuration().in_house_pharmacy_id),
        discount: order.discount ?? 0,
      });
    }
    return data;
  }

  async getOrders(q: string) {
    const filter: {
      status?: Record<string, string> | string;
      priority?: string;
    } = {};

    filter.status = {
      $ne: OrderStatus.Deleted,
    };

    // if (q === 'stat') {
    //   filter.priority = OrderPriority.Stat;
    // } else if (q === 'ready') {
    //   filter.status = OrderStatus.Ready;
    // }

    if (q === OrderStatus.Pending) {
      filter.status = OrderStatus.Pending;
    } else if (q === OrderStatus.Filling) {
      filter.status = OrderStatus.Filling;
    } else if (q === OrderStatus.Ready) {
      filter.status = OrderStatus.Ready;
    } else if (q === OrderStatus.Completed) {
      filter.status = OrderStatus.Completed;
    }

    const data = await this.orderModel
      .find(filter)
      .populate('patient')
      .populate('doctor', 'name phoneNumber specialization')
      .populate('items.name')
      .sort({ createdAt: -1 });
    return data;
  }

  async deleteOrder(id: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id))
      throw new BadRequestException(
        'Order id is not valid. Please check your order id.',
      );

    const data = await this.orderModel
      .findByIdAndUpdate(
        id,
        {
          status: OrderStatus.Deleted,
        },
        { new: true, runValidators: true },
      )
      .lean();

    if (!data) {
      throw new BadRequestException(
        'Sorry, the order doesn’t exist. Please check your order details.',
      );
    }
    return data;
  }

  async getSingleOrder(q: string) {
    const searchRegex = { $regex: '^' + q, $options: 'i' };

    const filter = {
      $or: [{ mrn: searchRegex }],
    };

    const data = await this.orderModel
      .findOne(filter)
      .populate('patient')
      .populate('doctor', 'name phoneNumber specialization')
      .populate('items.name')
      .lean();

    if (!data) {
      throw new NotFoundException('Order not found');
    }

    return data;
  }

  async itemPacked(
    packedDto: PackedDto,
    user: mongoose.Types.ObjectId,
  ): Promise<void> {
    const { order: orderId, item } = packedDto;

    const order = await this.orderModel
      .findOneAndUpdate(
        { _id: orderId, 'items.name': item },
        { $set: { 'items.$.isPacked': true, status: OrderStatus.Filling } },
        { new: true },
      )
      .exec();

    if (!order) {
      throw new NotFoundException(
        'Order or item not found. Please check your details.',
      );
    }

    const isFullyPacked = order.items.every((it) => Boolean(it.isPacked));
    if (isFullyPacked && order.status !== OrderStatus.Ready) {
      order.status = OrderStatus.Ready;
      await order.save();
    }
    const qty =
      order.items.find((e) => String(e.name) === String(item))?.quantity ?? 0;
    await this.itemsService.decreaseItem(item, qty, user);
  }

  async markAllAsPacked(
    markAllAsPackedDto: MarkAllAsPackedDto,
    user: mongoose.Types.ObjectId,
  ): Promise<void> {
    const orderId = markAllAsPackedDto.order;
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) {
      throw new NotFoundException(
        'Order not found. Please check your details.',
      );
    }
    const unpacked = (order.items ?? []).filter((i) => !i.isPacked);

    if (unpacked.length > 0) {
      await Promise.all(
        unpacked.map((it) =>
          this.itemsService.decreaseItem(it.name, it.quantity, user),
        ),
      );
    }

    const result = await this.orderModel
      .updateOne(
        { _id: orderId },
        {
          $set: {
            'items.$[].isPacked': true,
            status: OrderStatus.Ready,
          },
        },
      )
      .exec();

    if (result.matchedCount === 0) {
      throw new NotFoundException(
        'Order not found. Please check your details.',
      );
    }
  }

  async getCustomers() {
    const customers: {
      _id: mongoose.ObjectId;
      name: string;
      phoneNumber: string;
      gender: string;
      dateOfBirth: Date;
      address: string;
      mrn: string;
      createdAt: Date;
    }[] = await this.orderModel
      .aggregate([
        { $match: { patient: { $exists: true, $ne: null } } },
        { $group: { _id: '$patient' } },
        {
          $lookup: {
            from: 'patients',
            localField: '_id',
            foreignField: '_id',
            as: 'patient',
          },
        },
        { $unwind: { path: '$patient', preserveNullAndEmptyArrays: false } },
        { $replaceRoot: { newRoot: '$patient' } },
        {
          $project: {
            name: 1,
            address: 1,
            mrn: 1,
            dateOfBirth: 1,
            gender: 1,
            phoneNumber: 1,
            createdAt: 1,
            doctor: 1,
          },
        },
      ])
      .exec();

    type OrderPlain = {
      _id: mongoose.Types.ObjectId;
      patient: {
        _id: mongoose.Types.ObjectId;
        name: string;
        phoneNumber: string;
        gender: string;
        dateOfBirth: Date;
        mrn: string;
      };
      items: {
        name: { unitPrice: number } | null;
        quantity: number;
      }[];
      createdAt: Date;
    };

    const orders: OrderPlain[] = (await this.orderModel
      .find({
        status: { $ne: OrderStatus.Deleted },
        patient: { $in: customers.map((e) => e._id) },
      })
      .select('patient items.quantity createdAt')
      .populate('items.name', 'unitPrice -_id')
      .populate('patient', 'name address mrn dateOfBirth gender phoneNumber')
      .sort({ createdAt: -1 })
      .lean()
      .exec()) as any;

    return customers
      .sort((a, b) => -a.createdAt.getTime() + b.createdAt.getTime())
      .map((e) => {
        const order = orders.filter(
          (i) => i.patient._id.toString() === e._id.toString(),
        );
        const totalSpend: number = order.reduce(
          (a, b) =>
            a +
            b.items.reduce(
              (c, d) => c + d.quantity * (d?.name?.unitPrice ?? 0),
              0,
            ),
          0,
        );

        return {
          totalSpend,
          visits: order.length,
          patient: e,
          lastPurchase: order[0]?.createdAt,
        };
      });
  }

  async getCustomer(patientId: mongoose.Types.ObjectId) {
    const [sampleOrder, orders] = await Promise.all([
      this.orderModel
        .findOne({ patient: patientId })
        .populate('patient')
        .select('patient')
        .lean()
        .exec(),
      this.orderModel
        .find({ patient: patientId })
        .populate('items.name', 'unitPrice name generic manufacturer  -_id ')
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
    ]);

    const patient = sampleOrder?.patient ?? null;

    if (!patient) {
      throw new NotFoundException('This patient has not purchased any items.');
    }
    const totalVisit = orders.length;

    const totalSpend: number = orders.reduce((orderAcc, order: any) => {
      const itemsTotal: number = (order.items || []).reduce(
        (
          itemAcc: number,
          item: { quantity: number; name: { unitPrice: number } },
        ) => {
          const qty = Number(item.quantity ?? 0);
          const price = Number(item.name?.unitPrice ?? 0);
          return itemAcc + qty * price;
        },
        0,
      );
      return orderAcc + itemsTotal;
    }, 0);

    const averageSpend = totalVisit > 0 ? totalSpend / totalVisit : 0;
    const lastPurchase: Date | null = (orders[0] as any)?.createdAt ?? null;

    return {
      patient,
      orders,
      totalVisit,
      averageSpend,
      totalSpend,
      lastPurchase,
    };
  }

  updateOrder(dto: UpdateOrderDto) {
    const order = this.orderModel
      .findByIdAndUpdate(dto._id, dto, { new: true, runValidators: true })
      .lean();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async completeOrder(id: mongoose.Types.ObjectId) {
    const data = await this.orderModel
      .findByIdAndUpdate(id, { status: OrderStatus.Completed }, { new: true })
      .lean();
    if (!data) {
      throw new NotFoundException('Order not found');
    }


    // const { autoGenerateBill } = await this.usersService.getPharmacyBilling(configuration().in_house_pharmacy_id);
    // if (autoGenerateBill) {
    //   const items = await Promise.all(
    //     data.items.map(async (item) => {
    //       const itemData = await this.itemsService.getItem(item.name);

    //       const unitPrice = itemData.unitPrice;
    //       const quantity = item.quantity;

    //       return {
    //         name: itemData.name,
    //         unitPrice,
    //         quantity,
    //         discount: 0,
    //         gst: 0,
    //         total: unitPrice * quantity,
    //       };
    //     })
    //   );

    //   await this.billingService.generateBill({
    //     patient: data.patient,
    //     items,
    //     user: new mongoose.Types.ObjectId(configuration().in_house_pharmacy_id),
    //     discount: data.discount ?? 0,
    //   });
    // }
    return data;
  }

  async repeatOrder(id: mongoose.Types.ObjectId) {
    const existOrder = await this.orderModel.findById(id).lean().exec();
    if (!existOrder) {
      throw new NotFoundException('Order not found');
    }
    const newOrder: any = {}
    const mrn = await this.generateUniqueMRN();
    newOrder.mrn = mrn;
    newOrder.patient = existOrder.patient;
    newOrder.doctor = existOrder.doctor;
    newOrder.items = existOrder.items.map((item) => {
      return {
        ...item,
        isPacked: false,
      };
    });
    newOrder.priority = existOrder.priority;
    newOrder.discount = existOrder.discount;
    newOrder.assignedTo = existOrder.assignedTo;
    const data = await this.orderModel.create(newOrder);

    const { autoGenerateBill } = await this.usersService.getPharmacyBilling(configuration().in_house_pharmacy_id);
    if (autoGenerateBill) {
      const items = await Promise.all(
        data.items.map(async (item) => {
          const itemData = await this.itemsService.getItem(item.name);

          const unitPrice = itemData.unitPrice;
          const quantity = item.quantity;

          return {
            name: itemData.name,
            unitPrice,
            quantity,
            discount: 0,
            gst: 0,
            total: unitPrice * quantity,
          };
        })
      );

      await this.billingService.generateBill({
        patient: data.patient,
        items,
        user: new mongoose.Types.ObjectId(configuration().in_house_pharmacy_id),
        discount: data.discount ?? 0,
      });
    }

    return data;
  }
}
