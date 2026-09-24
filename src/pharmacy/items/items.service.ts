import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { AddItemDto } from './dto/add-items.dto';
import { InjectModel } from '@nestjs/mongoose';
import { BatchStatus, Item, ItemStatus } from './schemas/item.schema';
import { GetItemsDto } from './dto/get-items.dto';
import {
  CreateBatchDto,
  PatchBatchStatusDto,
  UpdateBatchDto,
} from './dto/batch.dto';
import { parse } from 'json2csv';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ItemsService {
  constructor(
    @InjectModel(Item.name) private itemModel: Model<Item>,
    private readonly usersService: UsersService,
  ) { }

  /** Escape user search input so regex metacharacters cannot break queries. */
  private sanitizeSearchRegex(q: string): string {
    return String(q || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** Dual-read helpers for legacy flat / purchasePrice-only batches. */
  resolvePurchaseRate(batch: any): number {
    const rate = batch?.purchaseRate ?? batch?.purchasePrice;
    return Number.isFinite(Number(rate)) ? Number(rate) : 0;
  }

  resolveSaleRate(batch: any, itemFallback = 0): number {
    const rate = batch?.saleRate ?? batch?.sellingPrice ?? itemFallback;
    return Number.isFinite(Number(rate)) ? Number(rate) : 0;
  }

  resolveBatchMrp(batch: any, itemFallback = 0): number {
    const rate = batch?.mrp ?? itemFallback;
    return Number.isFinite(Number(rate)) ? Number(rate) : 0;
  }

  resolveBatchStatus(batch: any): BatchStatus {
    const s = String(batch?.status || BatchStatus.Active).toLowerCase();
    return s === BatchStatus.Inactive
      ? BatchStatus.Inactive
      : BatchStatus.Active;
  }

  isBatchActive(batch: any): boolean {
    return this.resolveBatchStatus(batch) === BatchStatus.Active;
  }

  /**
   * Legacy rows may have packing: 0 which fails schema min:1 on save (500).
   * Normalize before any persist path.
   */
  ensureValidPacking(item: any): void {
    const packing = Number(item?.packing);
    if (!Number.isFinite(packing) || packing < 1) {
      item.packing = 1;
    }
  }

  /**
   * Recalculate denormalized item.quantity / expiry / rates from active batches.
   * When there are no batches, leave flat historical values untouched (dual-read).
   */
  recalculateItemStockFromBatches(item: any): void {
    const batches = item.batches || [];
    if (!batches.length) {
      return;
    }

    const active = batches.filter((b: any) => this.isBatchActive(b));
    item.quantity = active.reduce(
      (sum: number, b: any) => sum + (Number(b.quantity) || 0),
      0,
    );

    const withExpiry = active
      .filter((b: any) => b?.expiryDate)
      .sort(
        (a: any, b: any) =>
          new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime(),
      );
    if (withExpiry.length) {
      item.expiryDate = withExpiry[0].expiryDate;
    }

    // Prefer most recently created active batch for denormalized rates
    const byCreated = [...active].sort(
      (a: any, b: any) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );
    const latest = byCreated[0];
    if (latest) {
      item.purchasePrice = this.resolvePurchaseRate(latest);
      item.unitPrice = this.resolveSaleRate(latest, item.unitPrice);
      item.mrp = this.resolveBatchMrp(latest, item.mrp);
      if (latest.supplier) {
        item.supplier = latest.supplier;
      }
    }

    item.markModified?.('batches');
  }

  /**
   * Migration helper (non-destructive): if an item has flat stock/prices but
   * no batches, synthesize one OPENING batch so batch-first flows work.
   * Does NOT drop flat fields.
   */
  ensureLegacyBatchFromFlatItem(item: any): boolean {
    if ((item.batches || []).length > 0) return false;
    const qty = Number(item.quantity) || 0;
    if (qty <= 0 && !(Number(item.unitPrice) > 0 || Number(item.mrp) > 0)) {
      return false;
    }
    const purchaseRate = Number(item.purchasePrice) || 0;
    const saleRate = Number(item.unitPrice) || 0;
    const mrp = Number(item.mrp) || saleRate || 0;
    item.batches = item.batches || [];
    item.batches.push({
      batchNumber: 'LEGACY-OPENING',
      expiryDate: item.expiryDate || new Date('2099-12-31'),
      mrp,
      purchaseRate,
      purchasePrice: purchaseRate,
      saleRate,
      startingQuantity: qty,
      quantity: qty,
      status: BatchStatus.Active,
      supplier: item.supplier || '-',
      createdAt: item.createdAt || new Date(),
    });
    item.markModified?.('batches');
    return true;
  }

  private normalizeBatchInput(input: {
    batchNumber: string;
    expiryDate: Date | string;
    quantity: number;
    startingQuantity?: number;
    mrp?: number;
    purchaseRate?: number;
    purchasePrice?: number;
    saleRate?: number;
    unitPrice?: number;
    supplier?: string;
    status?: BatchStatus;
  }) {
    const purchaseRate =
      input.purchaseRate ?? input.purchasePrice ?? 0;
    const saleRate = input.saleRate ?? input.unitPrice ?? 0;
    const mrp = input.mrp ?? saleRate ?? 0;
    const quantity = Number(input.quantity) || 0;
    const startingQuantity =
      input.startingQuantity != null
        ? Number(input.startingQuantity)
        : quantity;

    return {
      batchNumber: String(input.batchNumber).trim(),
      expiryDate:
        input.expiryDate instanceof Date
          ? input.expiryDate
          : new Date(input.expiryDate),
      mrp: Number(mrp) || 0,
      purchaseRate: Number(purchaseRate) || 0,
      purchasePrice: Number(purchaseRate) || 0,
      saleRate: Number(saleRate) || 0,
      startingQuantity,
      quantity,
      status: input.status || BatchStatus.Active,
      supplier: (input.supplier || '-').trim() || '-',
      createdAt: new Date(),
    };
  }

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

    if (addItemDto.packing === undefined || addItemDto.packing < 1) {
      addItemDto.packing = 1;
    }

    const openingQty = addItemDto.openingStockQuantity ?? addItemDto.quantity ?? 0;
    const saleRate =
      addItemDto.saleRate ?? addItemDto.unitPrice ?? 0;
    const purchaseRate =
      addItemDto.purchaseRate ?? addItemDto.purchasePrice ?? 0;
    const mrp = addItemDto.mrp ?? saleRate ?? 0;

    const data = await this.itemModel.create({
      ...addItemDto,
      unitPrice: saleRate,
      purchasePrice: purchaseRate,
      mrp,
      quantity: addItemDto.batchNumber ? 0 : openingQty, // incremented by addBatchItems
      pharmacy,
    });

    if (addItemDto.batchNumber) {
      const updatedItem = await this.addBatchItems(data._id, {
        batchNumber: addItemDto.batchNumber,
        expiryDate: addItemDto?.expiryDate
          ? new Date(addItemDto?.expiryDate)
          : new Date(),
        purchaseRate,
        purchasePrice: purchaseRate,
        saleRate,
        mrp,
        quantity: openingQty,
        startingQuantity: openingQty,
        supplier: addItemDto.supplier || '-',
      });
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
      const escaped = this.sanitizeSearchRegex(q);
      const searchRegex = { $regex: '^' + escaped, $options: 'i' };
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

    if (stock && !lowStockItemsView) {
      const stockConditions: Record<string, number | Record<string, number>> = {
        Instock: { $gte: 20 },
        Low: { $gt: 0, $lt: 20 },
        Out: 0,
      };

      filter.quantity = stockConditions[stock];
    }
    if (lowStockItemsView && (stock === "Low" || stock === "Out" || !stock)) {
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

    const shouldCountLowStock = stock === "Low" || stock === "Out" || !stock;
    const lowStockFilter = {
      ...filter,
      quantity: { $lte: Number(lowStockThreshold ?? 20) },
    };

    const [items, total, lowStockCount] = await Promise.all([
      this.itemModel
        .find(filter)
        .sort(q ? { name: 1, [sortBy]: orderBy === 'asc' ? 1 : -1 } : { [sortBy]: orderBy === 'asc' ? 1 : -1 })  // sort BEFORE skip/limit
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

  async getInventoryStats(lowStockThreshold = 20) {
    const threshold = Number(lowStockThreshold) || 20;
    const baseFilter = { status: { $ne: ItemStatus.Deleted } };

    const [statsResult, highestMoving, lowestMoving] = await Promise.all([
      this.itemModel.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            totalQuantity: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $isNumber: '$quantity' },
                      { $gt: ['$quantity', 0] },
                    ],
                  },
                  '$quantity',
                  0,
                ],
              },
            },
            totalValue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $isNumber: '$quantity' },
                      { $gt: ['$quantity', 0] },
                      { $isNumber: '$unitPrice' },
                      { $gt: ['$unitPrice', 0] },
                    ],
                  },
                  { $multiply: ['$quantity', '$unitPrice'] },
                  0,
                ],
              },
            },
            outOfStockCount: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $not: [{ $isNumber: '$quantity' }] },
                      { $lte: ['$quantity', 0] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            lowStockCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $isNumber: '$quantity' },
                      { $gt: ['$quantity', 0] },
                      { $lte: ['$quantity', threshold] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      this.itemModel
        .findOne({ ...baseFilter, soldQuantity: { $gt: 0 } })
        .sort({ soldQuantity: -1 })
        .select('name generic sku soldQuantity unitPrice')
        .lean(),
      this.itemModel
        .findOne(baseFilter)
        .sort({ soldQuantity: 1 })
        .select('name generic sku soldQuantity unitPrice')
        .lean(),
    ]);

    const stats = statsResult[0] || {
      totalItems: 0,
      totalQuantity: 0,
      totalValue: 0,
      outOfStockCount: 0,
      lowStockCount: 0,
    };

    const rawTotalValue = Number(stats.totalValue);
    const safeTotalValue =
      Number.isFinite(rawTotalValue) && !isNaN(rawTotalValue)
        ? Math.round(rawTotalValue * 100) / 100
        : 0;

    const rawTotalQuantity = Number(stats.totalQuantity);
    const safeTotalQuantity =
      Number.isFinite(rawTotalQuantity) && !isNaN(rawTotalQuantity)
        ? Math.round(rawTotalQuantity * 100) / 100
        : 0;

    return {
      totalValue: safeTotalValue,
      totalItems: stats.totalItems || 0,
      totalQuantity: safeTotalQuantity,
      lowStockCount: stats.lowStockCount || 0,
      outOfStockCount: stats.outOfStockCount || 0,
      highestMoving: highestMoving
        ? {
            id: (highestMoving as any)._id,
            name: (highestMoving as any).name,
            generic: (highestMoving as any).generic,
            soldQuantity: (highestMoving as any).soldQuantity || 0,
          }
        : null,
      lowestMoving: lowestMoving
        ? {
            id: (lowestMoving as any)._id,
            name: (lowestMoving as any).name,
            generic: (lowestMoving as any).generic,
            soldQuantity: (lowestMoving as any).soldQuantity || 0,
          }
        : null,
    };
  }

  async getInventoryValueBreakdown() {
    const baseFilter = { status: { $ne: ItemStatus.Deleted } };

    const [byCategory, totals, topItems] = await Promise.all([
      this.itemModel.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: { $ifNull: ['$category', 'Uncategorized'] },
            itemCount: { $sum: 1 },
            quantity: {
              $sum: {
                $cond: [
                  { $and: [{ $isNumber: '$quantity' }, { $gt: ['$quantity', 0] }] },
                  '$quantity',
                  0,
                ],
              },
            },
            sellingValue: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$quantity', 0] },
                  { $ifNull: ['$unitPrice', 0] },
                ],
              },
            },
            purchaseValue: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$quantity', 0] },
                  { $ifNull: ['$purchasePrice', 0] },
                ],
              },
            },
            mrpValue: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$quantity', 0] },
                  { $ifNull: ['$mrp', 0] },
                ],
              },
            },
          },
        },
        { $sort: { sellingValue: -1 } },
      ]),
      this.itemModel.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            sellingValue: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$quantity', 0] },
                  { $ifNull: ['$unitPrice', 0] },
                ],
              },
            },
            purchaseValue: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$quantity', 0] },
                  { $ifNull: ['$purchasePrice', 0] },
                ],
              },
            },
            mrpValue: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$quantity', 0] },
                  { $ifNull: ['$mrp', 0] },
                ],
              },
            },
            totalQuantity: { $sum: { $ifNull: ['$quantity', 0] } },
            totalItems: { $sum: 1 },
          },
        },
      ]),
      this.itemModel
        .find(baseFilter)
        .select('name category quantity unitPrice purchasePrice mrp sku')
        .sort({ quantity: -1 })
        .limit(25)
        .lean(),
    ]);

    const round2 = (n: number) =>
      Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;

    const total = totals[0] || {
      sellingValue: 0,
      purchaseValue: 0,
      mrpValue: 0,
      totalQuantity: 0,
      totalItems: 0,
    };

    return {
      totals: {
        sellingValue: round2(total.sellingValue),
        purchaseValue: round2(total.purchaseValue),
        mrpValue: round2(total.mrpValue),
        totalQuantity: round2(total.totalQuantity),
        totalItems: total.totalItems || 0,
      },
      byCategory: byCategory.map((row) => ({
        category: row._id,
        itemCount: row.itemCount,
        quantity: round2(row.quantity),
        sellingValue: round2(row.sellingValue),
        purchaseValue: round2(row.purchaseValue),
        mrpValue: round2(row.mrpValue),
      })),
      topItems: topItems.map((item: any) => ({
        id: item._id,
        name: item.name,
        sku: item.sku,
        category: item.category,
        quantity: item.quantity || 0,
        sellingValue: round2((item.quantity || 0) * (item.unitPrice || 0)),
        purchaseValue: round2((item.quantity || 0) * (item.purchasePrice || 0)),
        mrpValue: round2((item.quantity || 0) * (item.mrp || 0)),
      })),
    };
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

    if (addItemDto.packing !== undefined && addItemDto.packing < 1) {
      addItemDto.packing = 1;
    }

    // SKU is item identity — never rekey via update.
    const { sku: _sku, ...updatePayload } = addItemDto;

    const data = await this.itemModel
      .findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true })
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
    user?: mongoose.Types.ObjectId,
    batchId?: string | null,
  ) {
    if (batchId) {
      return this.deductFromBatch(id, batchId, quantity, user);
    }

    const allowNegativeStock =
      await this.usersService.getPharmacyInventoryAllowNegativeStock(user);

    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new BadRequestException('Item is not available');
    }

    if (!allowNegativeStock && item.quantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock for ${item.name}. Available: ${item.quantity}, requested: ${quantity}`,
      );
    }

    const newQuantity = allowNegativeStock
      ? item.quantity - quantity
      : Math.max(item.quantity - quantity, 0);

    if (newQuantity !== item.quantity) {
      item.quantity = newQuantity;
    }

    if (quantity > 0) {
      item.soldQuantity = (item.soldQuantity || 0) + quantity;
      item.soldHistory.push({
        date: new Date(),
        quantity,
        unitPrice: item.unitPrice,
        total: item.unitPrice * quantity,
      });
    }

    this.ensureValidPacking(item);
    await item.save();
    return item;
  }

  /**
   * Sort helpers for manual batch pickers. FEFO = earliest expiry first;
   * FIFO = earliest createdAt first. Expired / inactive batches excluded by default.
   */
  sortBatches(
    batches: any[],
    mode: 'fefo' | 'fifo' = 'fefo',
    opts: { includeExpired?: boolean; includeInactive?: boolean } = {},
  ) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let list = [...(batches || [])];
    if (!opts.includeInactive) {
      list = list.filter((b) => this.isBatchActive(b));
    }
    if (!opts.includeExpired) {
      list = list.filter((b) => {
        if (!b?.expiryDate) return true;
        const exp = new Date(b.expiryDate);
        exp.setHours(0, 0, 0, 0);
        return exp >= now;
      });
    }
    list.sort((a, b) => {
      if (mode === 'fifo') {
        return (
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
        );
      }
      const ae = new Date(a.expiryDate || 0).getTime();
      const be = new Date(b.expiryDate || 0).getTime();
      if (ae !== be) return ae - be;
      return (
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime()
      );
    });
    return list;
  }

  async getItemBatches(
    id: mongoose.Types.ObjectId,
    sort: 'fefo' | 'fifo' = 'fefo',
    includeExpired = false,
    includeInactive = false,
  ) {
    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new NotFoundException('Item not found.');
    }

    // Dual-read: seed a legacy batch in-memory for pickers (persist only when mutated)
    const seeded = this.ensureLegacyBatchFromFlatItem(item);
    const packingWasInvalid =
      !Number.isFinite(Number(item.packing)) || Number(item.packing) < 1;
    this.ensureValidPacking(item);
    if (seeded || packingWasInvalid) {
      await item.save();
    }

    const sorted = this.sortBatches(item.batches || [], sort, {
      includeExpired,
      includeInactive,
    });

    const lean = item.toObject();

    return {
      itemId: lean._id,
      name: lean.name,
      packing: lean.packing ?? 1,
      unitPrice: lean.unitPrice,
      mrp: lean.mrp,
      gst: 0,
      quantity: lean.quantity,
      batches: sorted.map((b: any) => {
        const exp = b.expiryDate ? new Date(b.expiryDate) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expired = exp
          ? (() => {
              const e = new Date(exp);
              e.setHours(0, 0, 0, 0);
              return e < today;
            })()
          : false;
        const status = this.resolveBatchStatus(b);
        const purchaseRate = this.resolvePurchaseRate(b);
        const saleRate = this.resolveSaleRate(b, lean.unitPrice);
        const mrp = this.resolveBatchMrp(b, lean.mrp);
        const stock = Number(b.quantity) || 0;
        return {
          batchId: b._id?.toString?.() || b.batchNumber,
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate,
          purchaseRate,
          purchasePrice: purchaseRate,
          saleRate,
          sellingPrice: saleRate,
          mrp,
          gst: 0,
          stock,
          quantity: stock,
          startingQuantity: Number(b.startingQuantity) || stock,
          status,
          supplier: b.supplier,
          packing: lean.packing ?? 1,
          createdAt: b.createdAt,
          expired,
          available:
            !expired &&
            status === BatchStatus.Active &&
            stock > 0,
        };
      }),
    };
  }

  async suggestBatch(
    id: mongoose.Types.ObjectId,
    sort: 'fefo' | 'fifo' = 'fefo',
  ) {
    const data = await this.getItemBatches(id, sort, false);
    const pick = data.batches.find((b) => b.available);
    return { suggested: pick || null, ...data };
  }

  async deductFromBatch(
    itemId: mongoose.Types.ObjectId,
    batchId: string,
    quantity: number,
    user?: mongoose.Types.ObjectId,
  ) {
    if (!quantity || quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    const allowNegativeStock =
      await this.usersService.getPharmacyInventoryAllowNegativeStock(user);

    const item = await this.itemModel.findById(itemId);
    if (!item) {
      throw new BadRequestException('Item is not available');
    }

    const batchIndex = (item.batches || []).findIndex(
      (b: any) =>
        b._id?.toString() === batchId.toString() ||
        b.batchNumber === batchId,
    );
    if (batchIndex === -1) {
      throw new BadRequestException('Selected batch not found');
    }

    const batch: any = item.batches[batchIndex];
    if (!this.isBatchActive(batch)) {
      throw new BadRequestException(
        `Cannot sell from inactive batch ${batch.batchNumber}`,
      );
    }

    if (batch.expiryDate) {
      const exp = new Date(batch.expiryDate);
      exp.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (exp < today) {
        throw new BadRequestException(
          `Cannot sell from expired batch ${batch.batchNumber}`,
        );
      }
    }

    const batchQty = Number(batch.quantity) || 0;
    if (batchQty <= 0) {
      throw new BadRequestException(
        `Batch ${batch.batchNumber} has zero stock`,
      );
    }
    if (!allowNegativeStock && batchQty < quantity) {
      throw new BadRequestException(
        `Insufficient batch stock for ${item.name} (${batch.batchNumber}). Available: ${batchQty}, requested: ${quantity}`,
      );
    }

    batch.quantity = allowNegativeStock
      ? batchQty - quantity
      : Math.max(batchQty - quantity, 0);
    item.markModified('batches');

    this.recalculateItemStockFromBatches(item);

    const saleRate = this.resolveSaleRate(batch, item.unitPrice);
    item.soldQuantity = (item.soldQuantity || 0) + quantity;
    item.soldHistory.push({
      date: new Date(),
      quantity,
      unitPrice: saleRate,
      total: saleRate * quantity,
    });

    this.ensureValidPacking(item);
    await item.save();
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
      this.ensureValidPacking(item);
      await item.save();
    }

    return item;
  }

  /**
   * Create or upsert a batch. Same batchNumber on the same item merges stock
   * (purchase entry restock) and updates rates/expiry.
   */
  async addBatchItems(
    id: mongoose.Types.ObjectId,
    batchData: {
      batchNumber: string;
      quantity: number;
      expiryDate: Date | string;
      purchasePrice?: number;
      purchaseRate?: number;
      saleRate?: number;
      unitPrice?: number;
      mrp?: number;
      startingQuantity?: number;
      supplier?: string;
      status?: BatchStatus;
    },
    unitPrice?: number,
    mrp?: number,
  ) {
    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new BadRequestException('Item is not available');
    }

    const normalized = this.normalizeBatchInput({
      ...batchData,
      saleRate: batchData.saleRate ?? batchData.unitPrice ?? unitPrice,
      unitPrice: batchData.unitPrice ?? unitPrice,
      mrp: batchData.mrp ?? mrp,
    });

    const existingIdx = (item.batches || []).findIndex(
      (b: any) =>
        String(b.batchNumber).toLowerCase() ===
        normalized.batchNumber.toLowerCase(),
    );

    if (existingIdx >= 0) {
      const existing: any = item.batches[existingIdx];
      existing.quantity =
        (Number(existing.quantity) || 0) + normalized.quantity;
      existing.startingQuantity =
        (Number(existing.startingQuantity) || 0) + normalized.quantity;
      existing.expiryDate = normalized.expiryDate;
      existing.mrp = normalized.mrp;
      existing.purchaseRate = normalized.purchaseRate;
      existing.purchasePrice = normalized.purchaseRate;
      existing.saleRate = normalized.saleRate;
      existing.supplier = normalized.supplier || existing.supplier;
      if (normalized.status) {
        existing.status = normalized.status;
      } else if (!existing.status) {
        existing.status = BatchStatus.Active;
      }
    } else {
      item.batches.push(normalized as any);
    }

    item.markModified('batches');
    this.recalculateItemStockFromBatches(item);
    this.ensureValidPacking(item);
    await item.save();
    return item;
  }

  async createBatch(id: mongoose.Types.ObjectId, dto: CreateBatchDto) {
    return this.addBatchItems(id, {
      batchNumber: dto.batchNumber,
      quantity: dto.quantity,
      expiryDate: dto.expiryDate,
      purchaseRate: dto.purchaseRate,
      purchasePrice: dto.purchasePrice,
      saleRate: dto.saleRate,
      unitPrice: dto.unitPrice,
      mrp: dto.mrp,
      startingQuantity: dto.startingQuantity,
      supplier: dto.supplier,
      status: dto.status,
    });
  }

  async updateBatchByNumber(
    id: mongoose.Types.ObjectId,
    batchNumber: string,
    dto: UpdateBatchDto,
  ) {
    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new BadRequestException('Item is not available');
    }

    const batchIndex = (item.batches || []).findIndex(
      (b: any) =>
        String(b.batchNumber).toLowerCase() ===
        String(batchNumber).toLowerCase(),
    );
    if (batchIndex === -1) {
      throw new NotFoundException(`Batch ${batchNumber} not found`);
    }

    const batch: any = item.batches[batchIndex];
    if (dto.expiryDate != null) batch.expiryDate = new Date(dto.expiryDate);
    if (dto.mrp != null) batch.mrp = Number(dto.mrp);
    if (dto.purchaseRate != null || dto.purchasePrice != null) {
      const rate = dto.purchaseRate ?? dto.purchasePrice ?? 0;
      batch.purchaseRate = Number(rate);
      batch.purchasePrice = Number(rate);
    }
    if (dto.saleRate != null || dto.unitPrice != null) {
      batch.saleRate = Number(dto.saleRate ?? dto.unitPrice ?? 0);
    }
    if (dto.quantity != null) batch.quantity = Number(dto.quantity);
    if (dto.startingQuantity != null) {
      batch.startingQuantity = Number(dto.startingQuantity);
    }
    if (dto.supplier != null) batch.supplier = dto.supplier;
    if (dto.status != null) batch.status = dto.status;

    // Backfill missing new fields on live edit of legacy batches
    if (batch.purchaseRate == null) {
      batch.purchaseRate = this.resolvePurchaseRate(batch);
    }
    if (batch.saleRate == null) {
      batch.saleRate = this.resolveSaleRate(batch, item.unitPrice);
    }
    if (batch.mrp == null) {
      batch.mrp = this.resolveBatchMrp(batch, item.mrp);
    }
    if (batch.startingQuantity == null) {
      batch.startingQuantity = Number(batch.quantity) || 0;
    }
    if (!batch.status) batch.status = BatchStatus.Active;

    item.markModified('batches');
    this.recalculateItemStockFromBatches(item);
    this.ensureValidPacking(item);
    await item.save();
    return item;
  }

  async patchBatchStatus(
    id: mongoose.Types.ObjectId,
    batchNumber: string,
    dto: PatchBatchStatusDto,
  ) {
    return this.updateBatchByNumber(id, batchNumber, { status: dto.status });
  }

  async deleteBatch(
    id: mongoose.Types.ObjectId,
    batchId: string,
    deductStock = false,
  ) {
    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new BadRequestException('Item is not available');
    }

    const batchIndex = item.batches.findIndex(
      (b: any) =>
        b._id?.toString() === batchId.toString() ||
        b.batchNumber === batchId,
    );

    if (batchIndex === -1) {
      throw new BadRequestException('Batch not found');
    }

    item.batches.splice(batchIndex, 1);
    item.markModified('batches');

    if (deductStock || (item.batches || []).length > 0) {
      this.recalculateItemStockFromBatches(item);
    }

    this.ensureValidPacking(item);
    await item.save();
    return item;
  }

  async getSuppliers() {
    const data = await this.itemModel.distinct('supplier').lean();
    return data.filter((supplier) => supplier !== '' && supplier !== '-');
  }

  async addMRP() {
    const cursor = this.itemModel
      .find({ mrp: { $exists: false } })
      .cursor();

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
