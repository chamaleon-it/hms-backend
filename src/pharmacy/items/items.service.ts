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

/** Active-batch filter for aggregation pipelines. */
const ACTIVE_BATCH_COND = {
  $ne: [
    { $toLower: { $ifNull: ['$$b.status', BatchStatus.Active] } },
    BatchStatus.Inactive,
  ],
};

@Injectable()
export class ItemsService {
  constructor(
    @InjectModel(Item.name) private itemModel: Model<Item>,
    private readonly usersService: UsersService,
  ) {}

  /** Escape user search input so regex metacharacters cannot break queries. */
  private sanitizeSearchRegex(q: string): string {
    return String(q || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  resolvePurchaseRate(batch: any): number {
    return Number(batch?.purchaseRate) || 0;
  }

  /**
   * Pack/strip purchase rate → stock purchase value.
   * Prefer stripCount; else qty/packing; else qty.
   */
  resolveBatchPurchaseValue(batch: any): number {
    const rate = this.resolvePurchaseRate(batch);
    const qty = Number(batch?.quantity) || 0;
    const packing = Number(batch?.packing) || 0;
    const strips = Number(batch?.stripCount) || 0;
    if (strips > 0) return rate * strips;
    if (packing > 0 && qty > 0) return rate * (qty / packing);
    return rate * qty;
  }

  resolveUnitPrice(batch: any): number {
    return Number(batch?.unitPrice) || 0;
  }

  resolveBatchMrp(batch: any): number {
    return Number(batch?.mrp) || 0;
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

  activeBatches(item: any): any[] {
    return (item?.batches || []).filter((b: any) => this.isBatchActive(b));
  }

  sumActiveQuantity(item: any): number {
    return this.activeBatches(item).reduce(
      (sum: number, b: any) => sum + (Number(b.quantity) || 0),
      0,
    );
  }

  earliestExpiry(item: any): Date | null {
    const withExpiry = this.activeBatches(item)
      .filter((b: any) => b?.expiryDate)
      .sort(
        (a: any, b: any) =>
          new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime(),
      );
    return withExpiry.length ? withExpiry[0].expiryDate : null;
  }

  latestActiveBatch(item: any): any | null {
    const batches = this.activeBatches(item);
    if (!batches.length) return null;
    const byCreated = [...batches].sort(
      (a: any, b: any) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );
    return byCreated[0];
  }

  /** Latest active batch unit price. */
  resolveItemUnitPrice(item: any): number {
    const latest = this.latestActiveBatch(item);
    return latest ? this.resolveUnitPrice(latest) : 0;
  }

  /**
   * API/FE display enrichment only — computed from batches, not persisted.
   */
  enrichItem(lean: any): any {
    if (!lean) return lean;
    const latest = this.latestActiveBatch(lean);
    return {
      ...lean,
      quantity: this.sumActiveQuantity(lean),
      expiryDate: this.earliestExpiry(lean),
      unitPrice: latest ? this.resolveUnitPrice(latest) : 0,
      mrp: latest ? this.resolveBatchMrp(latest) : 0,
      purchasePrice: latest ? this.resolvePurchaseRate(latest) : 0,
      supplier: latest?.supplier || '-',
    };
  }

  /**
   * No denormalized Item.quantity/expiryDate — mark batches dirty only.
   */
  recalculateItemStockFromBatches(item: any): void {
    item.markModified?.('batches');
  }

  private normalizeBatchInput(input: {
    batchNumber: string;
    expiryDate: Date | string;
    quantity: number;
    startingQuantity?: number;
    mrp?: number;
    purchaseRate?: number;
    unitPrice?: number;
    supplier?: string;
    status?: BatchStatus;
    packing?: number;
    stripCount?: number;
    gst?: number;
  }) {
    const purchaseRate = Number(input.purchaseRate) || 0;
    const unitPrice = Number(input.unitPrice) || 0;
    const mrp = Number(input.mrp ?? unitPrice) || 0;
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
      mrp,
      purchaseRate,
      unitPrice,
      startingQuantity,
      quantity,
      status: input.status || BatchStatus.Active,
      supplier: (input.supplier || '-').trim() || '-',
      packing: Number(input.packing) || 0,
      stripCount: Number(input.stripCount) || 0,
      gst: Number(input.gst) || 0,
      createdAt: new Date(),
    };
  }

  /** Aggregation expression: sum of active batch quantities. */
  private activeQuantityExpr() {
    return {
      $sum: {
        $map: {
          input: {
            $filter: {
              input: { $ifNull: ['$batches', []] },
              as: 'b',
              cond: ACTIVE_BATCH_COND,
            },
          },
          as: 'ab',
          in: { $ifNull: ['$$ab.quantity', 0] },
        },
      },
    };
  }

  /** Aggregation expression: earliest active batch expiry. */
  private earliestExpiryExpr() {
    return {
      $min: {
        $map: {
          input: {
            $filter: {
              input: { $ifNull: ['$batches', []] },
              as: 'b',
              cond: {
                $and: [
                  ACTIVE_BATCH_COND,
                  { $ne: [{ $ifNull: ['$$b.expiryDate', null] }, null] },
                ],
              },
            },
          },
          as: 'ab',
          in: '$$ab.expiryDate',
        },
      },
    };
  }

  private batchValueExpr(priceField: string) {
    return {
      $sum: {
        $map: {
          input: {
            $filter: {
              input: { $ifNull: ['$batches', []] },
              as: 'b',
              cond: ACTIVE_BATCH_COND,
            },
          },
          as: 'ab',
          in: {
            $multiply: [
              { $ifNull: ['$$ab.quantity', 0] },
              { $ifNull: [`$$ab.${priceField}`, 0] },
            ],
          },
        },
      },
    };
  }

  /**
   * Purchase rate is pack/strip-level (purchase entry: gross = strips × rate).
   * Value = purchaseRate × stripCount, or purchaseRate × (qty/packing), else × qty.
   * Example: P.Rate 110, pack 10, qty 100 / strips 10 → ₹1,100 (not 110×100).
   */
  private batchPurchaseValueExpr() {
    return {
      $sum: {
        $map: {
          input: {
            $filter: {
              input: { $ifNull: ['$batches', []] },
              as: 'b',
              cond: ACTIVE_BATCH_COND,
            },
          },
          as: 'ab',
          in: {
            $let: {
              vars: {
                rate: { $ifNull: ['$$ab.purchaseRate', 0] },
                qty: { $ifNull: ['$$ab.quantity', 0] },
                packing: { $ifNull: ['$$ab.packing', 0] },
                strips: { $ifNull: ['$$ab.stripCount', 0] },
              },
              in: {
                $multiply: [
                  '$$rate',
                  {
                    $cond: [
                      { $gt: ['$$strips', 0] },
                      '$$strips',
                      {
                        $cond: [
                          {
                            $and: [
                              { $gt: ['$$packing', 0] },
                              { $gt: ['$$qty', 0] },
                            ],
                          },
                          { $divide: ['$$qty', '$$packing'] },
                          '$$qty',
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    };
  }

  async addItems(pharmacy: mongoose.Types.ObjectId, addItemDto: AddItemDto) {
    if (!addItemDto.generic) {
      addItemDto.generic = addItemDto.name;
    }

    if (!addItemDto.rackLocation) {
      addItemDto.rackLocation = '-';
    }
    if (!addItemDto.hsnCode) {
      addItemDto.hsnCode = '-';
    }

    if (!addItemDto.manufacturer) {
      addItemDto.manufacturer = '-';
    }

    const openingQty =
      addItemDto.openingStockQuantity ?? addItemDto.quantity ?? 0;
    const unitPrice = addItemDto.unitPrice ?? 0;
    const purchaseRate = addItemDto.purchaseRate ?? 0;
    const mrp = addItemDto.mrp ?? unitPrice ?? 0;

    // Master-only create — pricing/stock live on batches
    const data = await this.itemModel.create({
      name: addItemDto.name,
      generic: addItemDto.generic,
      hsnCode: addItemDto.hsnCode,
      category: addItemDto.category,
      manufacturer: addItemDto.manufacturer,
      rackLocation: addItemDto.rackLocation,
      status: addItemDto.status,
      pharmacy,
    });

    if (addItemDto.batchNumber) {
      return this.addBatchItems(data._id, {
        batchNumber: addItemDto.batchNumber,
        expiryDate: addItemDto?.expiryDate
          ? new Date(addItemDto?.expiryDate)
          : new Date(),
        purchaseRate,
        unitPrice,
        mrp,
        quantity: openingQty,
        startingQuantity: openingQty,
        supplier: addItemDto.supplier || '-',
        packing: addItemDto.packing,
        stripCount: addItemDto.stripCount,
        gst: addItemDto.gst,
      });
    }

    if (openingQty > 0) {
      return this.addBatchItems(data._id, {
        batchNumber: 'OPENING',
        expiryDate: addItemDto?.expiryDate
          ? new Date(addItemDto.expiryDate)
          : new Date('2099-12-31'),
        purchaseRate,
        unitPrice,
        mrp,
        quantity: openingQty,
        startingQuantity: openingQty,
        supplier: addItemDto.supplier || '-',
        packing: addItemDto.packing,
        stripCount: addItemDto.stripCount,
        gst: addItemDto.gst,
      });
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
    const threshold = Number(lowStockThreshold ?? 20);

    const match: Record<string, unknown> = {
      status: { $ne: ItemStatus.Deleted },
    };

    if (q) {
      const escaped = this.sanitizeSearchRegex(q);
      const searchRegex = { $regex: '^' + escaped, $options: 'i' };
      match.$or = [{ name: searchRegex }, { generic: searchRegex }];
    }

    if (category) {
      match.category = category;
    }

    if (query.supplier) {
      match['batches.supplier'] = query.supplier;
    }

    const postMatch: Record<string, unknown> = {};

    if (stock && !lowStockItemsView) {
      const stockConditions: Record<string, number | Record<string, number>> = {
        Instock: { $gte: 20 },
        Low: { $gt: 0, $lt: 20 },
        Out: 0,
      };
      postMatch.quantity = stockConditions[stock];
    }
    if (lowStockItemsView && (stock === 'Low' || stock === 'Out' || !stock)) {
      postMatch.quantity = { $lte: threshold };
    }

    if (query.expiry) {
      const days = Number(query.expiry);
      if (!isNaN(days) && days > 0) {
        const now = new Date();
        const targetDate = new Date();
        targetDate.setDate(now.getDate() + days);
        postMatch.expiryDate = { $gte: now, $lte: targetDate };
      }
    }

    const sortDir = orderBy === 'asc' ? 1 : -1;
    const sortSpec: Record<string, 1 | -1> = q
      ? { name: 1, [sortBy]: sortDir }
      : { [sortBy]: sortDir };

    const shouldCountLowStock = stock === 'Low' || stock === 'Out' || !stock;

    const addComputed = {
      $addFields: {
        quantity: this.activeQuantityExpr(),
        expiryDate: this.earliestExpiryExpr(),
      },
    };

    const pipeline: any[] = [{ $match: match }, addComputed];
    if (Object.keys(postMatch).length) {
      pipeline.push({ $match: postMatch });
    }

    const facetPipeline: any[] = [
      ...pipeline,
      {
        $facet: {
          items: [{ $sort: sortSpec }, { $skip: skip }, { $limit: limit }],
          total: [{ $count: 'count' }],
          lowStock: shouldCountLowStock
            ? [
                { $match: { quantity: { $lte: threshold } } },
                { $count: 'count' },
              ]
            : [],
        },
      },
    ];

    const [facet] = await this.itemModel.aggregate(facetPipeline);
    const items = (facet?.items || []).map((row: any) => this.enrichItem(row));
    const total = facet?.total?.[0]?.count || 0;
    const lowStockCount = facet?.lowStock?.[0]?.count || 0;

    return { items, total, lowStockCount };
  }

  async getInventoryStats(lowStockThreshold = 20) {
    const threshold = Number(lowStockThreshold) || 20;
    const baseFilter = { status: { $ne: ItemStatus.Deleted } };

    const [statsResult, highestMoving, lowestMoving] = await Promise.all([
      this.itemModel.aggregate([
        { $match: baseFilter },
        {
          $addFields: {
            quantity: this.activeQuantityExpr(),
            itemValue: this.batchValueExpr('unitPrice'),
          },
        },
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            totalQuantity: {
              $sum: {
                $cond: [{ $gt: ['$quantity', 0] }, '$quantity', 0],
              },
            },
            totalValue: {
              $sum: {
                $cond: [{ $gt: ['$itemValue', 0] }, '$itemValue', 0],
              },
            },
            outOfStockCount: {
              $sum: {
                $cond: [{ $lte: ['$quantity', 0] }, 1, 0],
              },
            },
            lowStockCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
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
        .select('name generic soldQuantity')
        .lean(),
      this.itemModel
        .findOne(baseFilter)
        .sort({ soldQuantity: 1 })
        .select('name generic soldQuantity')
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

    const addValues = {
      $addFields: {
        quantity: this.activeQuantityExpr(),
        sellingValue: this.batchValueExpr('unitPrice'),
        purchaseValue: this.batchPurchaseValueExpr(),
        mrpValue: this.batchValueExpr('mrp'),
      },
    };

    const [byCategory, totals, topItems] = await Promise.all([
      this.itemModel.aggregate([
        { $match: baseFilter },
        addValues,
        {
          $group: {
            _id: { $ifNull: ['$category', 'Uncategorized'] },
            itemCount: { $sum: 1 },
            quantity: { $sum: '$quantity' },
            sellingValue: { $sum: '$sellingValue' },
            purchaseValue: { $sum: '$purchaseValue' },
            mrpValue: { $sum: '$mrpValue' },
          },
        },
        { $sort: { sellingValue: -1 } },
      ]),
      this.itemModel.aggregate([
        { $match: baseFilter },
        addValues,
        {
          $group: {
            _id: null,
            sellingValue: { $sum: '$sellingValue' },
            purchaseValue: { $sum: '$purchaseValue' },
            mrpValue: { $sum: '$mrpValue' },
            totalQuantity: { $sum: '$quantity' },
            totalItems: { $sum: 1 },
          },
        },
      ]),
      this.itemModel.aggregate([
        { $match: baseFilter },
        addValues,
        { $sort: { quantity: -1 } },
        { $limit: 25 },
        {
          $project: {
            name: 1,
            category: 1,
            quantity: 1,
            sellingValue: 1,
            purchaseValue: 1,
            mrpValue: 1,
          },
        },
      ]),
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
        category: item.category,
        quantity: item.quantity || 0,
        sellingValue: round2(item.sellingValue || 0),
        purchaseValue: round2(item.purchaseValue || 0),
        mrpValue: round2(item.mrpValue || 0),
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

    return this.enrichItem(data);
  }

  async updateItem(id: mongoose.Types.ObjectId, addItemDto: AddItemDto) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Invalid item ID.');
    }

    // Master-only update — strip batch/opening fields
    const {
      unitPrice: _unitPrice,
      mrp: _mrp,
      purchaseRate: _purchaseRate,
      openingStockQuantity: _opening,
      quantity: _quantity,
      expiryDate: _expiry,
      batchNumber: _batch,
      supplier: _supplier,
      packing: _packing,
      stripCount: _strip,
      gst: _gst,
      ...masterPayload
    } = addItemDto;

    const data = await this.itemModel
      .findByIdAndUpdate(id, masterPayload, { new: true, runValidators: true })
      .lean();

    if (!data) {
      throw new NotFoundException('Item not found.');
    }

    return this.enrichItem(data);
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
    const csv = parse(items.map((i) => this.enrichItem(i)));
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

    const available = this.sumActiveQuantity(item);
    if (!allowNegativeStock && available < quantity) {
      throw new BadRequestException(
        `Insufficient stock for ${item.name}. Available: ${available}, requested: ${quantity}`,
      );
    }

    let remaining = quantity;
    const fefo = this.sortBatches(item.batches || [], 'fefo');
    for (const batch of fefo) {
      if (remaining <= 0) break;
      const q = Number(batch.quantity) || 0;
      if (q <= 0) continue;
      const take = Math.min(q, remaining);
      (batch as any).quantity = q - take;
      remaining -= take;
    }

    // Negative stock: put remainder on first active (incl. expired) batch
    if (remaining > 0 && allowNegativeStock) {
      const actives = this.activeBatches(item);
      if (actives.length) {
        const target = actives[0];
        target.quantity = (Number(target.quantity) || 0) - remaining;
        remaining = 0;
      }
    }

    item.markModified('batches');
    this.recalculateItemStockFromBatches(item);

    if (quantity > 0) {
      item.soldQuantity = (item.soldQuantity || 0) + quantity;
      const rate = this.resolveItemUnitPrice(item);
      item.soldHistory.push({
        date: new Date(),
        quantity,
        unitPrice: rate,
        total: rate * quantity,
      });
    }

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

    const sorted = this.sortBatches(item.batches || [], sort, {
      includeExpired,
      includeInactive,
    });

    const lean = item.toObject();
    const itemUnitPrice = this.resolveItemUnitPrice(lean);
    const latest = this.latestActiveBatch(lean);

    return {
      itemId: lean._id,
      name: lean.name,
      packing: Number(latest?.packing) || 1,
      unitPrice: itemUnitPrice,
      mrp: latest ? this.resolveBatchMrp(latest) : 0,
      gst: Number(latest?.gst) || 0,
      quantity: this.sumActiveQuantity(lean),
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
        const unitPrice = this.resolveUnitPrice(b);
        const mrp = this.resolveBatchMrp(b);
        const stock = Number(b.quantity) || 0;
        return {
          batchId: b._id?.toString?.() || b.batchNumber,
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate,
          purchaseRate,
          unitPrice,
          mrp,
          gst: Number(b.gst) || 0,
          stock,
          quantity: stock,
          startingQuantity: Number(b.startingQuantity) || stock,
          status,
          supplier: b.supplier,
          packing: Number(b.packing) || 1,
          stripCount: Number(b.stripCount) || 0,
          createdAt: b.createdAt,
          expired,
          available:
            !expired && status === BatchStatus.Active && stock > 0,
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

    const unitPrice = this.resolveUnitPrice(batch);
    item.soldQuantity = (item.soldQuantity || 0) + quantity;
    item.soldHistory.push({
      date: new Date(),
      quantity,
      unitPrice,
      total: unitPrice * quantity,
    });

    await item.save();
    return item;
  }

  async increaseItem(id: mongoose.Types.ObjectId, quantity: number) {
    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new BadRequestException('Item is not available');
    }

    const actives = this.activeBatches(item);
    if (actives.length) {
      const target = actives[0];
      target.quantity = (Number(target.quantity) || 0) + quantity;
      item.markModified('batches');
    } else {
      item.batches = item.batches || [];
      item.batches.push(
        this.normalizeBatchInput({
          batchNumber: 'OPENING',
          expiryDate: new Date('2099-12-31'),
          quantity,
          startingQuantity: quantity,
          unitPrice: 0,
          purchaseRate: 0,
          mrp: 0,
          supplier: '-',
        }) as any,
      );
      item.markModified('batches');
    }

    this.recalculateItemStockFromBatches(item);
    await item.save();
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
      purchaseRate?: number;
      unitPrice?: number;
      mrp?: number;
      startingQuantity?: number;
      supplier?: string;
      status?: BatchStatus;
      packing?: number;
      stripCount?: number;
      gst?: number;
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
      existing.unitPrice = normalized.unitPrice;
      existing.supplier = normalized.supplier || existing.supplier;
      if (normalized.packing != null) existing.packing = normalized.packing;
      if (normalized.stripCount != null) {
        existing.stripCount = normalized.stripCount;
      }
      if (normalized.gst != null) existing.gst = normalized.gst;
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
    await item.save();
    return item;
  }

  async createBatch(id: mongoose.Types.ObjectId, dto: CreateBatchDto) {
    return this.addBatchItems(id, {
      batchNumber: dto.batchNumber,
      quantity: dto.quantity,
      expiryDate: dto.expiryDate,
      purchaseRate: dto.purchaseRate,
      unitPrice: dto.unitPrice,
      mrp: dto.mrp,
      startingQuantity: dto.startingQuantity,
      supplier: dto.supplier,
      status: dto.status,
      packing: dto.packing,
      stripCount: dto.stripCount,
      gst: dto.gst,
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
    if (dto.purchaseRate != null) {
      batch.purchaseRate = Number(dto.purchaseRate);
    }
    if (dto.unitPrice != null) {
      batch.unitPrice = Number(dto.unitPrice);
    }
    if (dto.quantity != null) batch.quantity = Number(dto.quantity);
    if (dto.startingQuantity != null) {
      batch.startingQuantity = Number(dto.startingQuantity);
    }
    if (dto.supplier != null) batch.supplier = dto.supplier;
    if (dto.packing != null) batch.packing = Number(dto.packing);
    if (dto.stripCount != null) batch.stripCount = Number(dto.stripCount);
    if (dto.gst != null) batch.gst = Number(dto.gst);
    if (dto.status != null) batch.status = dto.status;

    if (batch.purchaseRate == null) {
      batch.purchaseRate = this.resolvePurchaseRate(batch);
    }
    if (batch.unitPrice == null) {
      batch.unitPrice = this.resolveUnitPrice(batch);
    }
    if (batch.mrp == null) {
      batch.mrp = this.resolveBatchMrp(batch);
    }
    if (batch.startingQuantity == null) {
      batch.startingQuantity = Number(batch.quantity) || 0;
    }
    if (!batch.status) batch.status = BatchStatus.Active;

    item.markModified('batches');
    this.recalculateItemStockFromBatches(item);
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

    await item.save();
    return item;
  }

  async getSuppliers() {
    const rows = await this.itemModel.aggregate([
      { $unwind: { path: '$batches', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$batches.supplier' } },
      { $match: { _id: { $nin: [null, '', '-'] } } },
      { $sort: { _id: 1 } },
    ]);
    return rows.map((r) => r._id);
  }

  async addMRP() {
    return { message: 'noop' };
  }
}
