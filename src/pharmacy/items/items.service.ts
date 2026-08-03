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
    let sku: string;
    let exists = true;

    do {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      sku = `MED${randomNum}`;

      // Check if SKU already exists
      const existing = await this.itemModel.exists({ sku });
      exists = !!existing;
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
      await this.addBatchItems(
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
        addItemDto.unitPrice,
      );
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
      sortBy = 'createdAt',
      orderBy = 'desc',
    } = query;

    const skip = (page - 1) * limit;

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
          // { supplier: searchRegex },
          // { manufacturer: searchRegex },
        ],
      };
    }

    if (category) {
      filter.category = category;
    }

    if (stock && !lowStockItemsView) {
      const stockConditions: Record<string, number | Record<string, number>> = {
        Instock: { $gte: 20 },
        Low: { $gt: 0, $lt: 20 },
        Out: 0,
      };

      filter.quantity = stockConditions[stock];
    }
    if (lowStockItemsView && (stock === 'Low' || stock === 'Out' || !stock)) {
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

    const [items, total, lowStockCount] = await Promise.all([
      this.itemModel
        .find(filter)
        .sort(
          q
            ? { name: 1, [sortBy]: orderBy === 'asc' ? 1 : -1 }
            : { [sortBy]: orderBy === 'asc' ? 1 : -1 },
        ) // sort BEFORE skip/limit
        .skip(skip)
        .limit(limit)
        .lean(),
      this.itemModel.countDocuments(filter),
      shouldCountLowStock
        ? this.itemModel.countDocuments(lowStockFilter)
        : Promise.resolve(0),
    ]);

    // const lowStockCount = stock === "Low" || stock === "Out" || !stock ? await this.itemModel.countDocuments({
    //   ...filter,
    //   quantity: { $lte: Number(lowStockThreshold ?? 20) },
    // }) : 0;

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
    batchIdOrNumber?: mongoose.Types.ObjectId | string,
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
    }

    if (item.batches && item.batches.length > 0 && quantity > 0) {
      let targetBatch: any = null;

      if (batchIdOrNumber) {
        const targetStr = String(batchIdOrNumber).trim();
        targetBatch = item.batches.find(
          (b: any) =>
            (b._id && String(b._id) === targetStr) ||
            (b.batchNumber && b.batchNumber.trim() === targetStr),
        );
      }

      if (!targetBatch && item.activeBatch) {
        targetBatch = item.batches.find(
          (b: any) => b._id && String(b._id) === String(item.activeBatch),
        );
      }

      if (!targetBatch) {
        targetBatch =
          item.batches.find((b: any) => b.quantity > 0) || item.batches[0];
      }

      let remainingToDeduct = quantity;
      if (targetBatch) {
        const deduct = allowNegativeStock
          ? remainingToDeduct
          : Math.min(targetBatch.quantity, remainingToDeduct);
        targetBatch.quantity = Math.max(targetBatch.quantity - deduct, 0);
        remainingToDeduct -= deduct;
      }

      if (remainingToDeduct > 0 && !allowNegativeStock) {
        for (const b of item.batches as any[]) {
          if (remainingToDeduct <= 0) break;
          if (b !== targetBatch && b.quantity > 0) {
            const deduct = Math.min(b.quantity, remainingToDeduct);
            b.quantity -= deduct;
            remainingToDeduct -= deduct;
          }
        }
      }
    }

    if (quantity > 0 && newQuantity >= 0) {
      const newSoldQuantity = (item.soldQuantity || 0) + quantity;
      item.soldQuantity = newSoldQuantity;
      if (!item.soldHistory) item.soldHistory = [];
      item.soldHistory.push({
        date: new Date(),
        quantity,
        unitPrice: item.unitPrice,
        total: item.unitPrice * quantity,
      });
    }

    await item.save();
    return item;
  }

  async increaseItem(
    id: mongoose.Types.ObjectId,
    quantity: number,
    batchIdOrNumber?: mongoose.Types.ObjectId | string,
  ) {
    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new BadRequestException('Item is not available');
    }
    const newQuantity = item.quantity + quantity;

    if (newQuantity !== item.quantity) {
      item.quantity = newQuantity;
    }

    if (item.batches && item.batches.length > 0 && quantity > 0) {
      let targetBatch: any = null;
      if (batchIdOrNumber) {
        const targetStr = String(batchIdOrNumber).trim();
        targetBatch = item.batches.find(
          (b: any) =>
            (b._id && String(b._id) === targetStr) ||
            (b.batchNumber && b.batchNumber.trim() === targetStr),
        );
      }

      if (!targetBatch && item.activeBatch) {
        targetBatch = item.batches.find(
          (b: any) => b._id && String(b._id) === String(item.activeBatch),
        );
      }

      if (!targetBatch) {
        targetBatch = item.batches[0];
      }

      if (targetBatch) {
        targetBatch.quantity += quantity;
      }
    }

    await item.save();
    return item;
  }

  async addBatchItems(
    id: mongoose.Types.ObjectId,
    batchData: {
      batchNumber: string;
      quantity: number;
      pack?: number;
      noOfPack?: number;
      mrp?: number;
      expiryDate: Date;
      purchasePrice: number;
      free?: number;
      schemaAmt?: number;
      total?: number;
      supplier: string;
    },
    unitPrice?: number,
    mrp?: number,
  ) {
    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new BadRequestException('Item is not available');
    }

    const newBatchId = new mongoose.Types.ObjectId();
    item.batches.push({
      _id: newBatchId,
      ...batchData,
      pack: batchData.pack ?? item.packing ?? 0,
      noOfPack: batchData.noOfPack ?? 0,
      mrp: batchData.mrp ?? mrp ?? item.mrp ?? 0,
      unitPrice: unitPrice,
      free: batchData.free ?? 0,
      schemaAmt: batchData.schemaAmt ?? 0,
      total: batchData.total ?? 0,
      createdAt: new Date(),
    } as any);
    item.quantity += batchData.quantity;
    if (batchData.pack) item.packing = batchData.pack;
    if (batchData.noOfPack) item.noOfPacking = batchData.noOfPack;
    if (unitPrice) item.unitPrice = unitPrice;
    if (mrp) item.mrp = mrp;
    if (batchData.mrp) item.mrp = batchData.mrp;
    item.expiryDate = batchData.expiryDate;
    item.purchasePrice = batchData.purchasePrice;
    item.supplier = batchData.supplier;

    // Auto-set active batch: nearest future expiry (skip expired batches)
    const now = new Date();
    let nearestBatch: any = null;
    let nearestExpiry: Date | null = null;

    for (const batch of item.batches as any[]) {
      const exp = new Date(batch.expiryDate);
      if (exp > now) {
        if (!nearestExpiry || exp < nearestExpiry) {
          nearestExpiry = exp;
          nearestBatch = batch;
        }
      }
    }

    const lastBatch = item.batches.length
      ? (item.batches[item.batches.length - 1] as any)
      : null;
    item.activeBatch = nearestBatch?._id ?? lastBatch?._id ?? null;

    await item.save();

    return item;
  }

  async setActiveBatch(
    itemId: mongoose.Types.ObjectId,
    batchId: mongoose.Types.ObjectId,
  ) {
    const item = await this.itemModel.findById(itemId);
    if (!item) {
      throw new NotFoundException('Item not found.');
    }

    const batch = (item.batches as any).id(batchId);
    if (!batch) {
      throw new BadRequestException('Batch not found in this item.');
    }

    item.activeBatch = batchId;
    await item.save();

    return item;
  }

  async getSuppliers() {
    const data = await this.itemModel.distinct('supplier').lean();
    return data.filter((supplier) => supplier !== '' && supplier !== '-');
  }

  async addMRP() {
    const cursor = this.itemModel.find({ mrp: { $exists: false } }).cursor();

    for await (const item of cursor) {
      const newMrp = item.unitPrice;
      const newUnitPrice = item.unitPrice / (item.packing || 1);

      await this.itemModel.updateOne(
        { _id: item._id },
        {
          $set: {
            mrp: newMrp,
            unitPrice: newUnitPrice,
          },
        },
      );

      console.log(
        `Drug: ${item.name} | MRP: ${newMrp} | Packing: ${item.packing} | UnitPrice: ${newUnitPrice.toFixed(2)}`,
      );

      await this.delay(20);
    }

    console.log('✅ Completed updating all items');
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
