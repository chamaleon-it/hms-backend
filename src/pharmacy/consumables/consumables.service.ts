import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Item, ItemStatus } from '../items/schemas/item.schema';
import { ConsumableIssue } from './schemas/consumable-issue.schema';
import { IssueConsumableDto } from './dto/issue-consumable.dto';

@Injectable()
export class ConsumablesService {
  constructor(
    @InjectModel(Item.name) private itemModel: Model<Item>,
    @InjectModel(ConsumableIssue.name)
    private issueModel: Model<ConsumableIssue>,
  ) {}

  async listConsumables(q?: string) {
    const filter: Record<string, unknown> = {
      status: { $ne: ItemStatus.Deleted },
      category: { $regex: /^consumables?$/i },
    };
    if (q?.trim()) {
      filter.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { generic: { $regex: q.trim(), $options: 'i' } },
        { sku: { $regex: q.trim(), $options: 'i' } },
      ];
    }
    return this.itemModel
      .find(filter)
      .select(
        'name generic sku category quantity unitPrice purchasePrice mrp status',
      )
      .sort({ name: 1 })
      .lean();
  }

  async issue(userId: mongoose.Types.ObjectId, dto: IssueConsumableDto) {
    if (!mongoose.isValidObjectId(dto.itemId)) {
      throw new BadRequestException('Invalid item id');
    }

    const session = await this.itemModel.db.startSession();
    session.startTransaction();
    try {
      const item = await this.itemModel
        .findById(dto.itemId)
        .session(session);

      if (!item || item.status === ItemStatus.Deleted) {
        throw new NotFoundException('Consumable item not found');
      }

      if (!/^consumables?$/i.test(item.category || '')) {
        throw new BadRequestException(
          'Item is not a consumable. Use inventory sales for medicines.',
        );
      }

      if ((item.quantity || 0) < dto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${item.quantity || 0}`,
        );
      }

      item.quantity = (item.quantity || 0) - dto.quantity;
      await item.save({ session });

      const unitPurchasePrice = item.purchasePrice || 0;
      const [issue] = await this.issueModel.create(
        [
          {
            item: item._id,
            issuedBy: userId,
            quantity: dto.quantity,
            department: dto.department || null,
            note: dto.note || null,
            unitPurchasePrice,
            totalCost: unitPurchasePrice * dto.quantity,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return issue;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async listIssues(limit = 50) {
    return this.issueModel
      .find()
      .populate('item', 'name sku category')
      .populate('issuedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 200))
      .lean();
  }
}
