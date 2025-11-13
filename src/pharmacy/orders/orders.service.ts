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

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private readonly itemsService: ItemsService,
  ) {}

  private async generateUniqueMRN(): Promise<string> {
    let mrn: string;
    let exists = true;

    do {
      const randomNum = Math.floor(1000000 + Math.random() * 9000000);
      mrn = `RX${randomNum}`;

      // Check if MRN already exists
      const existing = await this.orderModel.exists({ mrn });
      exists = !!existing;
    } while (exists);

    return mrn;
  }

  async createOrder(order: CreateOrderDto) {
    const mrn = await this.generateUniqueMRN();
    order.mrn = mrn;
    const data = await this.orderModel.create(order);
    return data;
  }

  async getOrders(q: string) {
    const filter: any = {};

    filter.status = {
      $ne: OrderStatus.Deleted,
    };

    if (q === 'stat') {
      filter.priority = OrderPriority.Stat;
    } else if (q === 'ready') {
      filter.status = OrderStatus.Ready;
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
    const searchRegex = { $regex: q, $options: 'i' };

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

  async itemPacked(packedDto: PackedDto): Promise<void> {
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
    await this.itemsService.decreaseItem(item, qty);
  }

  async markAllAsPacked(markAllAsPackedDto: MarkAllAsPackedDto): Promise<void> {
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
          this.itemsService.decreaseItem(it.name, it.quantity),
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
}
