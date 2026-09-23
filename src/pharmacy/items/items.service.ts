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
      (addItemDto as any).openingStockQuantity ?? (addItemDto as any).quantity ?? 0;

    const batchNumber =
      addItemDto.batchNumber || (openingQty > 0 ? 'BATCH-01' : undefined);

    const data = await this.itemModel.create({
      name: addItemDto.name,
      pharmacy,
      generic: addItemDto.generic,
      hsnCode: addItemDto.hsnCode || '-',
      sku: addItemDto.sku,
      category: addItemDto.category,
      manufacturer: addItemDto.manufacturer || '-',
      rackLocation: addItemDto.rackLocation || '-',
      status: addItemDto.status || ItemStatus.Active,
      batches: [],
    });

    if (batchNumber) {
      const updatedItem = await this.addBatchItems(
        data._id,
        {
          batchNumber,
          expiryDate: addItemDto.expiryDate
            ? new Date(addItemDto.expiryDate)
            : new Date(),
          purchasePrice: addItemDto.purchasePrice || 0,
          quantity: openingQty,
          supplier: (addItemDto as any).supplier || '-',
          packing: (addItemDto as any).packing || 0,
          stripCount: (addItemDto as any).stripCount || (addItemDto as any).noOfpacking || 0,
          mrp: addItemDto.mrp || 0,
          unitPrice: addItemDto.unitPrice || 0,
          gst: (addItemDto as any).gst || 0,
        },
      );
      return updatedItem;
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
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = { $regex: escaped, $options: 'i' };
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
      (filter as any).$and = (filter as any).$and || [];
      if (stock === 'Instock') {
        (filter as any).$and.push({
          $expr: { $gte: [{ $sum: '$batches.quantity' }, 20] },
        });
      } else if (stock === 'Low') {
        (filter as any).$and.push({
          $expr: {
            $and: [
              { $gt: [{ $sum: '$batches.quantity' }, 0] },
              { $lt: [{ $sum: '$batches.quantity' }, 20] },
            ],
          },
        });
      } else if (stock === 'Out') {
        (filter as any).$and.push({
          $expr: { $lte: [{ $sum: '$batches.quantity' }, 0] },
        });
      }
    }

    if (
      lowStockItemsView &&
      !slowMovingItemsView &&
      (stock === 'Low' || stock === 'Out' || !stock)
    ) {
      (filter as any).$and = (filter as any).$and || [];
      (filter as any).$and.push({
        $expr: {
          $lte: [{ $sum: '$batches.quantity' }, Number(lowStockThreshold ?? 20)],
        },
      });
    }

    if (query.expiry) {
      const days = Number(query.expiry);
      if (!isNaN(days) && days > 0) {
        const now = new Date();
        const targetDate = new Date();
        targetDate.setDate(now.getDate() + days);
        filter['batches.expiryDate'] = { $gte: now, $lte: targetDate };
      }
    }

    if (query.supplier) {
      filter['batches.supplier'] = query.supplier;
    }

    filter.status = { $ne: ItemStatus.Deleted };

    const shouldCountLowStock = stock === 'Low' || stock === 'Out' || !stock;
    const lowStockFilter = {
      ...filter,
      $expr: {
        $lte: [{ $sum: '$batches.quantity' }, Number(lowStockThreshold ?? 20)],
      },
    };

    // Calculate slowMovingCount (items with batch quantity > 0 and soldInLast30Days <= 10)
    const activeItemsForCount = await this.itemModel
      .find({
        status: { $ne: ItemStatus.Deleted },
        $expr: { $gt: [{ $sum: '$batches.quantity' }, 0] },
      })
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
        $expr: { $gt: [{ $sum: '$batches.quantity' }, 0] },
      };
      const candidateItems = await this.itemModel.find(candidateFilter).lean();

      const mappedCandidates = candidateItems
        .map((it) => {
          const totalQty = (it.batches || []).reduce(
            (sum: number, b: any) => sum + (Number(b.quantity) || 0),
            0,
          );
          return {
            ...it,
            quantity: totalQty,
            soldInLast30Days: computeSoldInLast30Days(it),
          };
        })
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
      items = rawItems.map((it) => {
        const totalQty = (it.batches || []).reduce(
          (sum: number, b: any) => sum + (Number(b.quantity) || 0),
          0,
        );
        return {
          ...it,
          quantity: totalQty,
          soldInLast30Days: computeSoldInLast30Days(it),
        };
      });
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

    const totalQty = (data.batches || []).reduce(
      (sum: number, b: any) => sum + (Number(b.quantity) || 0),
      0,
    );

    return {
      ...data,
      quantity: totalQty,
    };
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
    batchNumber?: string,
  ) {
    const allowNegativeStock =
      await this.usersService.getPharmacyInventoryAllowNegativeStock(user);

    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new BadRequestException('Item is not available');
    }

    // If batch specified, deduct from that batch
    let effectiveUnitPrice = 0;
    if (batchNumber && item.batches && item.batches.length > 0) {
      const batch = item.batches.find(
        (b) => b.batchNumber && b.batchNumber.toLowerCase() === batchNumber.trim().toLowerCase(),
      );
      if (batch) {
        batch.quantity = allowNegativeStock
          ? (batch.quantity || 0) - quantity
          : Math.max((batch.quantity || 0) - quantity, 0);
        if (batch.unitPrice) {
          effectiveUnitPrice = batch.unitPrice;
        }
      }
    } else if (item.batches && item.batches.length > 0) {
      const batch = item.batches[0];
      if (batch?.unitPrice) {
        effectiveUnitPrice = batch.unitPrice;
      }
      batch.quantity = allowNegativeStock
        ? (batch.quantity || 0) - quantity
        : Math.max((batch.quantity || 0) - quantity, 0);
    }

    if (quantity > 0) {
      const newSoldQuantity = (item.soldQuantity || 0) + quantity;
      item.soldQuantity = newSoldQuantity;
      item.soldHistory.push({
        date: new Date(),
        quantity,
        unitPrice: effectiveUnitPrice,
        total: effectiveUnitPrice * quantity,
        customerName,
        customerPhone,
        doctorName,
        pharmacistName,
        patientMrn,
      });
    }

    await item.save();
    return item;
  }

  async increaseItem(id: mongoose.Types.ObjectId, quantity: number) {
    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new BadRequestException('Item is not available');
    }

    if (item.batches && item.batches.length > 0) {
      item.batches[0].quantity = (Number(item.batches[0].quantity) || 0) + quantity;
      await item.save();
    }

    return item;
  }

  async addBatchItems(
    id: mongoose.Types.ObjectId,
    batchData: {
      batchNumber: string;
      quantity: number;
      expiryDate: Date | string;
      purchasePrice?: number;
      supplier?: string;
      packing?: number;
      stripCount?: number;
      mrp?: number;
      unitPrice?: number;
      gst?: number;
    },
  ) {
    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new BadRequestException('Item is not available');
    }

    const unitPrice = Number(batchData.unitPrice ?? 0);
    const mrp = Number(batchData.mrp ?? 0);
    const purchasePrice = Number(batchData.purchasePrice ?? 0);
    const packing = Number(batchData.packing ?? 0);
    const stripCount = Number(batchData.stripCount ?? 0);
    const gst = Number(batchData.gst ?? 0);
    const quantity = Number(batchData.quantity ?? 0);
    const expiryDate = batchData.expiryDate ? new Date(batchData.expiryDate) : new Date();

    if (!item.batches) {
      item.batches = [];
    }

    const existingBatchIndex = item.batches.findIndex(
      (b) => b.batchNumber && b.batchNumber.toLowerCase() === batchData.batchNumber.trim().toLowerCase(),
    );

    if (existingBatchIndex >= 0) {
      const b = item.batches[existingBatchIndex];
      b.quantity = (Number(b.quantity) || 0) + quantity;
      b.expiryDate = expiryDate;
      if (purchasePrice > 0) b.purchasePrice = purchasePrice;
      if (unitPrice > 0) b.unitPrice = unitPrice;
      if (mrp > 0) b.mrp = mrp;
      if (packing > 0) b.packing = packing;
      if (stripCount > 0) b.stripCount = stripCount;
      if (gst >= 0) b.gst = gst;
      if (batchData.supplier && batchData.supplier !== '-') b.supplier = batchData.supplier;
    } else {
      item.batches.push({
        batchNumber: batchData.batchNumber.trim(),
        quantity,
        startingQuantity: quantity,
        expiryDate,
        purchasePrice,
        unitPrice,
        mrp,
        packing,
        stripCount,
        gst,
        isActive: true,
        supplier: batchData.supplier || '-',
        createdAt: new Date(),
      } as any);
    }

    await item.save();

    return item;
  }

  async getSuppliers() {
    const batchSuppliers = await this.itemModel.distinct('batches.supplier').lean();
    return batchSuppliers.filter((supplier) => supplier && supplier !== '' && supplier !== '-');
  }

  async updateBatch(
    itemId: mongoose.Types.ObjectId,
    batchId: string,
    data: {
      batchNumber?: string;
      expiryDate?: Date | string;
      quantity?: number;
      packing?: number;
      stripCount?: number;
      mrp?: number;
      unitPrice?: number;
      purchasePrice?: number;
      gst?: number;
      supplier?: string;
    },
  ) {
    const item = await this.itemModel.findById(itemId);
    if (!item) throw new BadRequestException('Item not found');

    const batch = item.batches.find((b: any) => b._id?.toString() === batchId);
    if (!batch) throw new BadRequestException('Batch not found');

    if (data.batchNumber !== undefined) batch.batchNumber = data.batchNumber;
    if (data.expiryDate !== undefined) (batch as any).expiryDate = new Date(data.expiryDate);
    if (data.quantity !== undefined) batch.quantity = Number(data.quantity);
    if (data.packing !== undefined) batch.packing = Number(data.packing);
    if (data.stripCount !== undefined) batch.stripCount = Number(data.stripCount);
    if (data.mrp !== undefined) batch.mrp = Number(data.mrp);
    if (data.unitPrice !== undefined) batch.unitPrice = Number(data.unitPrice);
    if (data.purchasePrice !== undefined) batch.purchasePrice = Number(data.purchasePrice);
    if (data.gst !== undefined) batch.gst = Number(data.gst);
    if (data.supplier !== undefined) batch.supplier = data.supplier;

    await item.save();
    return item;
  }

  async toggleBatchStatus(itemId: mongoose.Types.ObjectId, batchId: string) {
    const item = await this.itemModel.findById(itemId);
    if (!item) throw new BadRequestException('Item not found');

    const batch = item.batches.find((b: any) => b._id?.toString() === batchId);
    if (!batch) throw new BadRequestException('Batch not found');

    (batch as any).isActive = !(batch as any).isActive;
    await item.save();
    return item;
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
