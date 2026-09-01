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

  private async generateUniqueSKU(): Promise<string> {
    const prefix = 'ITM-';
    const lastRecord = await this.itemModel
      .findOne({ sku: { $regex: `^${prefix}\\d+$` } })
      .collation({ locale: 'en_US', numericOrdering: true })
      .sort({ sku: -1 })
      .select('sku')
      .lean()
      .exec();

    let nextNumber = 1;
    if (lastRecord && lastRecord.sku) {
      const match = lastRecord.sku.match(new RegExp(`^${prefix}(\\d+)$`));
      if (match && match[1]) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    let sku: string;
    let exists = true;
    do {
      sku = `${prefix}${nextNumber.toString().padStart(5, '0')}`;
      const existing = await this.itemModel.exists({ sku });
      exists = !!existing;
      if (exists) nextNumber++;
    } while (exists);

    return sku;
  }

  async addItems(pharmacy: mongoose.Types.ObjectId, addItemDto: AddItemDto) {
    if (!addItemDto.sku) {
      addItemDto.sku = await this.generateUniqueSKU();
    } else {
      const found = await this.itemModel
        .findOne({ sku: addItemDto.sku })
        .lean();
      if (found) {
        throw new BadRequestException(
          'This SKU is already assigned to another product.',
        );
      }
    }

    if (!addItemDto.generic) {
      addItemDto.generic = addItemDto.name;
    }

    if (!addItemDto.rackLocation) {
      addItemDto.rackLocation = '-';
    }
    if (!addItemDto.hsnCode) {
      addItemDto.hsnCode = '-';
    }
    if (!addItemDto.supplier) {
      addItemDto.supplier = '-';
    }

    if (!addItemDto.manufacturer) {
      addItemDto.manufacturer = '-';
    }

    const openingQty =
      addItemDto.openingStockQuantity ?? addItemDto.quantity ?? 0;

    const data = await this.itemModel.create({
      ...addItemDto,
      quantity: addItemDto.batchNumber ? 0 : openingQty, // will be incremented by addBatchItems if batch exists
      pharmacy,
    });

    if (addItemDto.batchNumber) {
      const updatedItem = await this.addBatchItems(
        data._id,
        {
          batchNumber: addItemDto.batchNumber,
          expiryDate: addItemDto?.expiryDate
            ? new Date(addItemDto?.expiryDate)
            : new Date(),
          purchasePrice: addItemDto.purchasePrice,
          quantity: openingQty,
          supplier: addItemDto.supplier || '-',
        },
        addItemDto.mrp,
      );
      return updatedItem; // ✅ return the DB-refreshed item with correct quantity
    }
    return data;
  }

  async getItems(query: GetItemsDto) {
    const {
      page = 1,
      limit = 10,
      q,
      category,
      stock,
      lowStockThreshold,
      lowStockItemsView,
      slowMovingItemsView,
      sortBy = 'createdAt',
      orderBy = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const computeSoldInLast30Days = (item: any) => {
      if (!item.soldHistory || !Array.isArray(item.soldHistory)) return 0;
      return item.soldHistory.reduce((sum: number, entry: any) => {
        if (!entry || !entry.date) return sum;
        const d = new Date(entry.date);
        if (d >= thirtyDaysAgo) {
          return sum + (Number(entry.quantity) || 0);
        }
        return sum;
      }, 0);
    };

    let filter: {
      $or?: Array<Record<string, Record<string, string>>>;
      category?: string;
      quantity?: number | Record<string, number>;
      expiryDate?: Record<string, Date>;
      status?: Record<string, string>;
      supplier?: string;
    } = {};

    if (q) {
      const searchRegex = { $regex: '^' + q, $options: 'i' };
      filter = {
        $or: [
          { name: searchRegex },
          { sku: searchRegex },
          { generic: searchRegex },
        ],
      };
    }

    if (category) {
      filter.category = category;
    }

    if (stock && !lowStockItemsView && !slowMovingItemsView) {
      const stockConditions: Record<string, number | Record<string, number>> = {
        Instock: { $gte: 20 },
        Low: { $gt: 0, $lt: 20 },
        Out: 0,
      };

      filter.quantity = stockConditions[stock];
    }

    if (
      lowStockItemsView &&
      !slowMovingItemsView &&
      (stock === 'Low' || stock === 'Out' || !stock)
    ) {
      filter.quantity = { $lte: Number(lowStockThreshold ?? 20) };
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

    if (query.supplier) {
      filter.supplier = query.supplier;
    }

    filter.status = { $ne: ItemStatus.Deleted };

    const shouldCountLowStock = stock === 'Low' || stock === 'Out' || !stock;
    const lowStockFilter = {
      ...filter,
      quantity: { $lte: Number(lowStockThreshold ?? 20) },
    };

    // Calculate slowMovingCount (items with quantity > 0 and soldInLast30Days <= 10)
    const activeItemsForCount = await this.itemModel
      .find(
        { status: { $ne: ItemStatus.Deleted }, quantity: { $gt: 0 } },
        { soldHistory: 1, quantity: 1 },
      )
      .lean();
    const slowMovingCount = activeItemsForCount.filter(
      (it) => computeSoldInLast30Days(it) <= 10,
    ).length;

    let items: any[] = [];
    let total = 0;

    if (slowMovingItemsView) {
      // Find all in-stock items matching filters
      const candidateFilter = {
        ...filter,
        quantity: { $gt: 0 },
      };
      const candidateItems = await this.itemModel.find(candidateFilter).lean();

      const mappedCandidates = candidateItems
        .map((it) => ({
          ...it,
          soldInLast30Days: computeSoldInLast30Days(it),
        }))
        .filter((it) => it.soldInLast30Days <= 10);

      // Sort by soldInLast30Days asc, then quantity desc
      mappedCandidates.sort((a, b) => {
        if (a.soldInLast30Days !== b.soldInLast30Days) {
          return a.soldInLast30Days - b.soldInLast30Days;
        }
        return b.quantity - a.quantity;
      });

      total = mappedCandidates.length;
      items = mappedCandidates.slice(skip, skip + limit);
    } else {
      const sortObj = q
        ? { name: 1, [sortBy]: orderBy === 'asc' ? 1 : -1 }
        : { [sortBy]: orderBy === 'asc' ? 1 : -1 };

      const [rawItems, count] = await Promise.all([
        this.itemModel
          .find(filter)
          .sort(sortObj as any)
          .skip(skip)
          .limit(limit)
          .lean(),
        this.itemModel.countDocuments(filter),
      ]);

      total = count;
      items = rawItems.map((it) => ({
        ...it,
        soldInLast30Days: computeSoldInLast30Days(it),
      }));
    }

    const lowStockCount = shouldCountLowStock
      ? await this.itemModel.countDocuments(lowStockFilter)
      : 0;

    return { items, data: items, total, lowStockCount, slowMovingCount };
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
    customerName?: string,
    customerPhone?: string,
    doctorName?: string,
    pharmacistName?: string,
    patientMrn?: string,
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

    if (quantity > 0 && newQuantity >= 0) {
      const newSoldQuantity = item.soldQuantity + quantity;
      item.soldQuantity = newSoldQuantity;
      item.soldHistory.push({
        date: new Date(),
        quantity,
        unitPrice: item.unitPrice,
        total: item.unitPrice * quantity,
        customerName,
        customerPhone,
        doctorName,
        pharmacistName,
        patientMrn,
      });
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
    unitPrice?: number,
    mrp?: number,
  ) {
    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new BadRequestException('Item is not available');
    }

    item.batches.push({ ...batchData, createdAt: new Date() });
    item.quantity += batchData.quantity;

    // if (
    //   !item.expiryDate ||
    //   new Date(batchData.expiryDate) < new Date(item.expiryDate) ||
    //   new Date() > new Date(item.expiryDate)
    // ) {
    item.expiryDate = batchData.expiryDate;
    item.purchasePrice = batchData.purchasePrice;
    item.supplier = batchData.supplier;
    // }
    if (unitPrice) {
      item.unitPrice = unitPrice;
    }
    if (mrp) {
      item.mrp = mrp;
    }
    await item.save();

    return item;
  }

  async getSuppliers() {
    const data = await this.itemModel.distinct('supplier').lean();
    return data.filter((supplier) => supplier !== '' && supplier !== '-');
  }


  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
