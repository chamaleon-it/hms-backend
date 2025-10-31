import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { AddItemDto } from './dto/add-items.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Item, ItemStatus } from './schemas/item.schema';
import { GetItemsDto } from './dto/get-items.dto';

@Injectable()
export class ItemsService {
  constructor(@InjectModel(Item.name) private itemModel: Model<Item>) {}

  async addItems(pharmacy: mongoose.Types.ObjectId, addItemDto: AddItemDto) {
    const found = await this.itemModel.findOne({ sku: addItemDto.sku }).lean();
    if (found) {
      throw new BadRequestException(
        'This SKU is already assigned to another product.',
      );
    }
    const data = await this.itemModel.create({ ...addItemDto, pharmacy });
    return data;
  }

  async getItems(query: GetItemsDto) {
    const { page = 1, limit = 10, q, category, stock } = query;

    const skip = (page - 1) * limit;

    let filter: any = {};

    if (q) {
      const searchRegex = { $regex: q, $options: 'i' };
      filter = {
        $or: [
          { name: searchRegex },
          { sku: searchRegex },
          { generic: searchRegex },
          { supplier: searchRegex },
          { manufacturer: searchRegex },
        ],
      };
    }

    if (category) {
      filter.category = category;
    }

    if (stock) {
      const stockConditions: Record<string, any> = {
        Instock: { $gte: 20 },
        Low: { $gt: 0, $lt: 20 },
        Out: 0,
      };

      filter.quantity = stockConditions[stock] ?? filter.quantity;
    }

    if (query.expiry) {
      const days = Number(query.expiry);
      if (!isNaN(days) && days > 0) {
        const now = new Date();
        const targetDate = new Date();
        targetDate.setDate(now.getDate() + days);
        filter.expiryDate = { $gte: now, $lte: targetDate };
      }
    }

    filter.status = { $ne: ItemStatus.Deleted };

    const [items, total] = await Promise.all([
      this.itemModel.find(filter).skip(skip).limit(limit).lean(),
      this.itemModel.countDocuments(filter),
    ]);

    return { items, total };
  }

  async getItem() {}
  async updateItem() {}
  async deleteItem(id: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Invalid item ID.');
    }

    const data = await this.itemModel
      .findByIdAndUpdate(
        id,
        { status: ItemStatus.Deleted },
        { new: true, runValidators: true },
      )
      .lean();

    if (!data) {
      throw new NotFoundException('Item not found.');
    }

    return data;
  }
}
