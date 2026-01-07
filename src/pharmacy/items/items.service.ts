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
import { parse } from 'json2csv';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ItemsService {
  constructor(
    @InjectModel(Item.name) private itemModel: Model<Item>,
    private readonly usersService: UsersService,
  ) { }

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
    const { page = 1, limit = 10, q, category, stock, lowStockThreshold } = query;

    const skip = (page - 1) * limit;

    let filter: {
      $or?: Array<Record<string, Record<string, string>>>;
      category?: string;
      quantity?: number | Record<string, number>;
      expiryDate?: Record<string, Date>;
      status?: Record<string, string>;
    } = {};

    if (q) {
      const searchRegex = { $regex: '^' + q, $options: 'i' };
      filter = {
        $or: [
          { name: searchRegex },
          { sku: searchRegex },
          { generic: searchRegex },
          // { supplier: searchRegex },
          // { manufacturer: searchRegex },
        ],
      };
    }

    if (category) {
      filter.category = category;
    }

    if (stock) {
      const stockConditions: Record<string, number | Record<string, number>> = {
        Instock: { $gte: 20 },
        Low: { $gt: 0, $lt: 20 },
        Out: 0,
      };

      filter.quantity = stockConditions[stock];
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



    const lowStockCount = await this.itemModel.countDocuments({
      quantity: { $lt: Number(lowStockThreshold) ?? 20 },
    });

    return { items, total, lowStockCount };
  }

  async getItem(id: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Invalid item ID.');
    }

    const data = await this.itemModel.findById(id).lean();

    if (!data) {
      throw new NotFoundException('Item not found.');
    }

    return data;
  }

  async updateItem(id: mongoose.Types.ObjectId, addItemDto: AddItemDto) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Invalid item ID.');
    }

    const data = await this.itemModel
      .findByIdAndUpdate(id, addItemDto, { new: true, runValidators: true })
      .lean();

    if (!data) {
      throw new NotFoundException('Item not found.');
    }

    return data;
  }

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

  async exportCsv() {
    const items = await this.itemModel.find().lean().exec();
    const csv = parse(items);
    const filename = `inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    return { csv, filename };
  }

  async decreaseItem(
    id: mongoose.Types.ObjectId,
    quantity: number,
    user: mongoose.Types.ObjectId,
  ) {
    const allowNegativeStock =
      await this.usersService.getPharmacyInventoryAllowNegativeStock(user);

    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new BadRequestException('Item is not available');
    }
    const newQuantity = allowNegativeStock
      ? item.quantity - quantity
      : Math.max(item.quantity - quantity, 0);

    if (newQuantity !== item.quantity) {
      item.quantity = newQuantity;
      await item.save();
    }

    return item;
  }

  async increaseItem(id: mongoose.Types.ObjectId, quantity: number) {
    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new BadRequestException('Item is not available');
    }
    const newQuantity = item.quantity + quantity;

    if (newQuantity !== item.quantity) {
      item.quantity = newQuantity;
      await item.save();
    }

    return item;
  }

  async addBatchItems(
    id: mongoose.Types.ObjectId,
    batchData: {
      batchNumber: string;
      quantity: number;
      expiryDate: Date;
      purchasePrice: number;
      supplier: string;
    },
  ) {
    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new BadRequestException('Item is not available');
    }

    item.batches.push({ ...batchData, createdAt: new Date() });
    item.quantity += batchData.quantity;

    if (
      !item.expiryDate ||
      new Date(batchData.expiryDate) < new Date(item.expiryDate) ||
      new Date() > new Date(item.expiryDate)
    ) {
      item.expiryDate = batchData.expiryDate;
      item.purchasePrice = batchData.purchasePrice;
      item.supplier = batchData.supplier;
    }
    await item.save();

    return item;
  }
}
