import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { BatchStatus, Item, ItemStatus } from '../items/schemas/item.schema';
import { ConsumableIssue } from './schemas/consumable-issue.schema';
import { IssueConsumableDto } from './dto/issue-consumable.dto';

@Injectable()
export class ConsumablesService {
  constructor(
    @InjectModel(Item.name) private itemModel: Model<Item>,
    @InjectModel(ConsumableIssue.name)
    private issueModel: Model<ConsumableIssue>,
  ) {}

  private isBatchActive(batch: any): boolean {
    return (
      String(batch?.status || BatchStatus.Active).toLowerCase() !==
      BatchStatus.Inactive
    );
  }

  private sumActiveQuantity(item: any): number {
    return (item?.batches || [])
      .filter((b: any) => this.isBatchActive(b))
      .reduce((sum: number, b: any) => sum + (Number(b.quantity) || 0), 0);
  }

  async listConsumables(q?: string) {
    const filter: Record<string, unknown> = {
      status: { $ne: ItemStatus.Deleted },
      category: { $regex: /^consumables?$/i },
    };
    if (q?.trim()) {
      filter.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { generic: { $regex: q.trim(), $options: 'i' } },
      ];
    }
    const rows = await this.itemModel
      .find(filter)
      .select('name generic category batches status')
      .sort({ name: 1 })
      .lean();

    return rows.map((item: any) => ({
      ...item,
      quantity: this.sumActiveQuantity(item),
    }));
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

      const available = this.sumActiveQuantity(item);
      if (available < dto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${available}`,
        );
      }

      // FEFO deduct from active non-expired batches with stock
      let remaining = dto.quantity;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const sorted = [...(item.batches || [])]
        .filter((b: any) => this.isBatchActive(b))
        .filter((b: any) => {
          if (!b?.expiryDate) return true;
          const exp = new Date(b.expiryDate);
          exp.setHours(0, 0, 0, 0);
          return exp >= now;
        })
        .sort(
          (a: any, b: any) =>
            new Date(a.expiryDate || 0).getTime() -
            new Date(b.expiryDate || 0).getTime(),
        );

      for (const batch of sorted) {
        if (remaining <= 0) break;
        const q = Number(batch.quantity) || 0;
        if (q <= 0) continue;
        const take = Math.min(q, remaining);
        (batch as any).quantity = q - take;
        remaining -= take;
      }

      item.markModified('batches');
      await item.save({ session });

      const activeBatch = (item.batches || []).find((b: any) =>
        this.isBatchActive(b),
      ) as any;
      const unitPurchasePrice = Number(activeBatch?.purchaseRate) || 0;
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
      .populate('item', 'name category')
      .populate('issuedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 200))
      .lean();
  }
}
