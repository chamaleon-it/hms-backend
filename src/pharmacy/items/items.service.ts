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

const PRIVATE_SALE_FIELDS = [
  'orderId', 'orderNumber', 'billNumber', 'batchNumber',
  'customerId', 'customerName', 'customerNumber', 'customerPhone',
  'saleKey',
];

export type SaleContext = {
  saleKey?: string;
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  billNumber?: string;
  customerId: mongoose.Types.ObjectId;
  customerName?: string;
  customerNumber?: string;
  customerPhone?: string;
  unitPrice?: number;
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
   * Resolve a batch on an item by stable subdoc `_id` and/or `batchNumber`.
   * B0 import wrote batches without `_id`; Mongoose invents a new id per load,
   * so order lines must also match on batchNumber (e.g. "B0").
   */
  findBatchIndex(
    batches: any[] | null | undefined,
    batchId?: string | null,
    batchNumber?: string | null,
  ): number {
    const list = batches || [];
    const id = batchId != null ? String(batchId).trim() : '';
    const num = batchNumber != null ? String(batchNumber).trim() : '';
    if (!id && !num) return -1;

    return list.findIndex((b: any) => {
      const bid = b?._id != null ? String(b._id) : '';
      const bnum = String(b?.batchNumber || '').trim();
      if (id && bid && bid === id) return true;
      // batchId may be the batchNumber when `_id` was missing at pick time
      if (id && bnum && bnum.toLowerCase() === id.toLowerCase()) return true;
      if (num && bnum && bnum.toLowerCase() === num.toLowerCase()) return true;
      return false;
    });
  }

  /**
   * Persist ObjectIds on batch subdocs that were inserted without `_id`
   * (raw Mongo replaceOne import). Call before returning batchIds to the FE.
   */
  async ensurePersistedBatchIds(
    id: mongoose.Types.ObjectId | string,
  ): Promise<boolean> {
    const lean = await this.itemModel.findById(id).lean().exec();
    if (!lean) return false;
    const batches = (lean as any).batches || [];
    if (!batches.some((b: any) => !b?._id)) return false;

    let healed = false;
    for (const [index, batch] of batches.entries()) {
      if (batch?._id) continue;
      const result = await this.itemModel.updateOne(
        {
          _id: id,
          [`batches.${index}._id`]: { $exists: false },
          [`batches.${index}.batchNumber`]: batch.batchNumber,
        },
        { $set: { [`batches.${index}._id`]: new mongoose.Types.ObjectId() } },
      );
      healed = healed || result.modifiedCount > 0;
    }
    return healed;
  }

  /**
   * Resolve a sellable batch for pack/complete. Handles stale ObjectIds left on
   * order lines after B0 import (batches rewritten without matching `_id`).
   * Preference: exact id/number → B0 → sole active stocked → FEFO first stocked.
   */
  async resolveBatchForSale(
    itemId: mongoose.Types.ObjectId | string,
    batchId?: string | null,
    batchNumber?: string | null,
  ): Promise<{ batchId: string; batchNumber: string; index: number } | null> {
    await this.ensurePersistedBatchIds(itemId);
    const item = await this.itemModel.findById(itemId).exec();
    if (!item) {
      throw new BadRequestException('Item is not available');
    }

    const batches = item.batches || [];
    let index = this.findBatchIndex(batches, batchId, batchNumber);

    if (index < 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sellable = batches.filter((b: any) => {
        if (!this.isBatchActive(b)) return false;
        if ((Number(b.quantity) || 0) <= 0) return false;
        if (b.expiryDate) {
          const exp = new Date(b.expiryDate);
          exp.setHours(0, 0, 0, 0);
          if (exp < today) return false;
        }
        return true;
      });

      const b0 = sellable.find(
        (b: any) => String(b.batchNumber || '').toUpperCase() === 'B0',
      );
      const pick =
        b0 ||
        (sellable.length === 1
          ? sellable[0]
          : this.sortBatches(sellable, 'fefo')[0]);

      if (!pick) return null;
      index = batches.indexOf(pick);
      if (index < 0) {
        index = this.findBatchIndex(
          batches,
          pick._id != null ? String(pick._id) : null,
          pick.batchNumber,
        );
      }
    }

    if (index < 0) return null;
    const batch: any = batches[index];
    return {
      batchId: batch._id != null ? String(batch._id) : String(batch.batchNumber),
      batchNumber: String(batch.batchNumber || ''),
      index,
    };
  }

  /**
   * Pack/strip purchase rate → stock purchase value on current qty:
   * (purchaseRate / packing) × quantity when packing > 0, else rate × qty.
   * Must use current quantity so value falls as stock is sold (like selling value).
   */
  resolveBatchPurchaseValue(batch: any): number {
    const rate = this.resolvePurchaseRate(batch);
    const qty = Number(batch?.quantity) || 0;
    const packing = Number(batch?.packing) || 0;
    if (packing > 0) return (rate / packing) * qty;
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
   * Value = (purchaseRate / packing) × current quantity so it tracks stock like selling value.
   * Example: P.Rate 110, pack 10, qty 100 → (110/10)×100 = ₹1,100.
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
              },
              in: {
                $cond: [
                  { $gt: ['$$packing', 0] },
                  {
                    $multiply: [
                      { $divide: ['$$rate', '$$packing'] },
                      '$$qty',
                    ],
                  },
                  { $multiply: ['$$rate', '$$qty'] },
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
    pipeline.push({
      $project: Object.fromEntries(
        PRIVATE_SALE_FIELDS.map((field) => [`soldHistory.${field}`, 0]),
      ),
    });
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
          },
        },
      ]),
    ]);

    const round2 = (n: number) =>
      Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;

    const total = totals[0] || {
      sellingValue: 0,
      purchaseValue: 0,
      totalQuantity: 0,
      totalItems: 0,
    };

    return {
      totals: {
        sellingValue: round2(total.sellingValue),
        purchaseValue: round2(total.purchaseValue),
        totalQuantity: round2(total.totalQuantity),
        totalItems: total.totalItems || 0,
      },
      byCategory: byCategory.map((row) => ({
        category: row._id,
        itemCount: row.itemCount,
        quantity: round2(row.quantity),
        sellingValue: round2(row.sellingValue),
        purchaseValue: round2(row.purchaseValue),
      })),
      topItems: topItems.map((item: any) => ({
        id: item._id,
        name: item.name,
        category: item.category,
        quantity: item.quantity || 0,
        sellingValue: round2(item.sellingValue || 0),
        purchaseValue: round2(item.purchaseValue || 0),
      })),
    };
  }

  async getItem(id: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Invalid item ID.');
    }

    const data = await this.itemModel
      .findById(id)
      .select(PRIVATE_SALE_FIELDS.map((field) => `-soldHistory.${field}`).join(' '))
      .lean();

    if (!data) {
      throw new NotFoundException('Item not found.');
    }

    return this.enrichItem(data);
  }

  async getSoldHistory(id: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Invalid item ID.');
    }
    const item = await this.itemModel.findById(id).select('soldHistory').lean();
    if (!item) {
      throw new NotFoundException('Item not found.');
    }
    return item.soldHistory || [];
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
    batchNumber?: string | null,
    sale?: SaleContext,
    session?: mongoose.ClientSession,
  ) {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }
    if (!sale?.saleKey) {
      throw new BadRequestException('A sale key is required to deduct stock');
    }
    if (batchId || batchNumber) {
      return this.deductFromBatch(id, batchId || batchNumber || '', quantity, user, batchNumber, sale, session);
    }
    return this.deductFromAvailableBatchesOnce(id, quantity, user, sale, session);
  }

  /** Atomically deduct an unselected legacy order line across FEFO batches. */
  private async deductFromAvailableBatchesOnce(
    id: mongoose.Types.ObjectId,
    quantity: number,
    user: mongoose.Types.ObjectId | undefined,
    sale: SaleContext,
    session?: mongoose.ClientSession,
  ) {
    await this.ensurePersistedBatchIds(id);
    const allowNegativeStock =
      await this.usersService.getPharmacyInventoryAllowNegativeStock(user);
    for (let attempt = 0; attempt < 5; attempt++) {
      const itemQuery = this.itemModel.findById(id);
      const item = await (session ? itemQuery.session(session) : itemQuery);
      if (!item) throw new BadRequestException('Item is not available');
      const priorSale = item.soldHistory.find((entry) => entry.saleKey === sale.saleKey);
      if (priorSale) {
        if (Number(priorSale.quantity) !== quantity) {
          throw new BadRequestException('This order line was already sold with a different quantity');
        }
        return item;
      }

      const batches = this.sortBatches(item.batches || [], 'fefo');
      const available = batches.reduce((sum, batch) => sum + Math.max(0, Number(batch.quantity) || 0), 0);
      if (!allowNegativeStock && available < quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.name}. Available: ${available}, requested: ${quantity}`,
        );
      }
      if (!batches.length) throw new BadRequestException(`No sellable batch for ${item.name}`);

      let remaining = quantity;
      const deductions = new Map<number, number>();
      for (const batch of batches) {
        if (remaining <= 0) break;
        const take = Math.min(Math.max(0, Number(batch.quantity) || 0), remaining);
        if (take <= 0) continue;
        const index = item.batches.indexOf(batch);
        deductions.set(index, take);
        remaining -= take;
      }
      if (remaining > 0) {
        const index = item.batches.indexOf(batches[0]);
        deductions.set(index, (deductions.get(index) || 0) + remaining);
      }

      const filter: Record<string, unknown> = {
        _id: id,
        'soldHistory.saleKey': { $ne: sale.saleKey },
      };
      const increments: Record<string, number> = { soldQuantity: quantity };
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (const [index, take] of deductions) {
        const batch = item.batches[index];
        filter[`batches.${index}._id`] = (batch as any)._id;
        filter[`batches.${index}.quantity`] = Number(batch.quantity) || 0;
        filter[`batches.${index}.status`] = { $ne: BatchStatus.Inactive };
        filter[`batches.${index}.expiryDate`] = { $gte: today };
        increments[`batches.${index}.quantity`] = -take;
      }
      const rate = typeof sale.unitPrice === 'number' && Number.isFinite(sale.unitPrice)
        ? sale.unitPrice
        : this.resolveItemUnitPrice(item);
      const updated = await this.itemModel.findOneAndUpdate(
        filter,
        {
          $inc: increments,
          $push: { soldHistory: { ...sale, date: new Date(), quantity, unitPrice: rate, total: rate * quantity } },
        },
        { new: true, ...(session ? { session } : {}) },
      );
      if (updated) return updated;
    }
    throw new BadRequestException('Stock changed while selling; please retry');
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
    // Stabilize batchIds before exposing them to FE / order create validation
    await this.ensurePersistedBatchIds(id);

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
        const persistedId = b._id != null ? String(b._id) : '';
        return {
          // Prefer persisted ObjectId; fall back to batchNumber for legacy rows
          batchId: persistedId || String(b.batchNumber || ''),
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
    batchNumber?: string | null,
    sale?: SaleContext,
    session?: mongoose.ClientSession,
  ) {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }
    if (!sale?.saleKey) {
      throw new BadRequestException('A sale key is required to deduct stock');
    }
    return this.deductFromBatchOnce(itemId, batchId, quantity, user, batchNumber, sale, session);
  }

  /** A sale key makes a stock deduction safe to retry after a timeout or double click. */
  private async deductFromBatchOnce(
    itemId: mongoose.Types.ObjectId,
    batchId: string,
    quantity: number,
    user: mongoose.Types.ObjectId | undefined,
    batchNumber: string | null | undefined,
    sale: SaleContext,
    session?: mongoose.ClientSession,
  ) {
    const allowNegativeStock =
      await this.usersService.getPharmacyInventoryAllowNegativeStock(user);
    for (let attempt = 0; attempt < 5; attempt++) {
      const itemQuery = this.itemModel.findById(itemId);
      const item = await (session ? itemQuery.session(session) : itemQuery);
      if (!item) throw new BadRequestException('Item is not available');
      const priorSale = item.soldHistory.find((entry) => entry.saleKey === sale.saleKey);
      if (priorSale) {
        if (Number(priorSale.quantity) !== quantity) {
          throw new BadRequestException('This order line was already sold with a different quantity');
        }
        return item;
      }

      const resolved = await this.resolveBatchForSale(itemId, batchId, batchNumber);
      if (!resolved) throw new BadRequestException('Selected batch not found');
      const index = this.findBatchIndex(item.batches, resolved.batchId, resolved.batchNumber);
      const batch = item.batches[index];
      if (!batch) throw new BadRequestException('Selected batch not found');
      if (!this.isBatchActive(batch)) {
        throw new BadRequestException(`Cannot sell from inactive batch ${batch.batchNumber}`);
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(batch.expiryDate) < today) {
        throw new BadRequestException(`Cannot sell from expired batch ${batch.batchNumber}`);
      }
      const stock = Number(batch.quantity) || 0;
      if (stock <= 0) throw new BadRequestException(`Batch ${batch.batchNumber} has zero stock`);
      if (!allowNegativeStock && stock < quantity) {
        throw new BadRequestException(
          `Insufficient batch stock for ${item.name} (${batch.batchNumber}). Available: ${stock}, requested: ${quantity}`,
        );
      }
      const rate = typeof sale.unitPrice === 'number' && Number.isFinite(sale.unitPrice)
        ? sale.unitPrice
        : this.resolveUnitPrice(batch);
      const updated = await this.itemModel.findOneAndUpdate(
        {
          _id: itemId,
          'soldHistory.saleKey': { $ne: sale.saleKey },
          [`batches.${index}._id`]: (batch as any)._id,
          [`batches.${index}.quantity`]: allowNegativeStock ? { $gt: 0 } : { $gte: quantity },
          [`batches.${index}.status`]: { $ne: BatchStatus.Inactive },
          [`batches.${index}.expiryDate`]: { $gte: today },
        },
        {
          $inc: { [`batches.${index}.quantity`]: -quantity, soldQuantity: quantity },
          $push: {
            soldHistory: {
              ...sale,
              date: new Date(),
              quantity,
              unitPrice: rate,
              total: rate * quantity,
              batchNumber: batch.batchNumber,
            },
          },
        },
        { new: true, ...(session ? { session } : {}) },
      );
      if (updated) return updated;
    }
    throw new BadRequestException('Stock changed while selling; please retry');
  }

  async increaseItem(id: mongoose.Types.ObjectId, quantity: number, session?: mongoose.ClientSession) {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }
    if (!session) await this.ensurePersistedBatchIds(id);
    for (let attempt = 0; attempt < 5; attempt++) {
      const itemQuery = this.itemModel.findById(id);
      const item = await (session ? itemQuery.session(session) : itemQuery);
      if (!item) throw new BadRequestException('Item is not available');
      const target = this.activeBatches(item)[0];
      if (!target) {
        if (session) {
          const opening = this.normalizeBatchInput({
            batchNumber: 'OPENING', expiryDate: new Date('2099-12-31'),
            quantity, startingQuantity: quantity, unitPrice: 0,
            purchaseRate: 0, mrp: 0, supplier: '-',
          });
          const updated = await this.itemModel.findOneAndUpdate(
            { _id: id }, { $push: { batches: opening } },
            { new: true, runValidators: true, session },
          );
          if (updated) return updated;
          continue;
        }
        return this.addBatchItems(id, {
          batchNumber: 'OPENING',
          expiryDate: new Date('2099-12-31'),
          quantity,
          startingQuantity: quantity,
          unitPrice: 0,
          purchaseRate: 0,
          mrp: 0,
          supplier: '-',
        });
      }
      const index = item.batches.indexOf(target);
      const updated = await this.itemModel.findOneAndUpdate(
        {
          _id: id,
          [`batches.${index}._id`]: (target as any)._id,
          [`batches.${index}.status`]: { $ne: BatchStatus.Inactive },
        },
        { $inc: { [`batches.${index}.quantity`]: quantity } },
        { new: true, ...(session ? { session } : {}) },
      );
      if (updated) return updated;
    }
    throw new BadRequestException('Stock changed while returning; please retry');
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
    const normalized = this.normalizeBatchInput({
      ...batchData,
      unitPrice: batchData.unitPrice ?? unitPrice,
      mrp: batchData.mrp ?? mrp,
    });
    if (!Number.isInteger(normalized.quantity) || normalized.quantity < 0) {
      throw new BadRequestException('Batch quantity must be a non-negative whole number');
    }
    await this.ensurePersistedBatchIds(id);
    const batchPattern = new RegExp(`^${this.sanitizeSearchRegex(normalized.batchNumber)}$`, 'i');
    for (let attempt = 0; attempt < 5; attempt++) {
      const item = await this.itemModel.findById(id);
      if (!item) throw new BadRequestException('Item is not available');
      const index = (item.batches || []).findIndex(
        (batch) => String(batch.batchNumber).toLowerCase() === normalized.batchNumber.toLowerCase(),
      );
      if (index >= 0) {
        const batch = item.batches[index];
        const set: Record<string, unknown> = {};
        for (const field of ['expiryDate', 'mrp', 'purchaseRate', 'unitPrice', 'supplier', 'packing', 'stripCount', 'gst', 'status'] as const) {
          set[`batches.${index}.${field}`] = normalized[field];
        }
        const updated = await this.itemModel.findOneAndUpdate(
          { _id: id, [`batches.${index}._id`]: (batch as any)._id },
          {
            $inc: {
              [`batches.${index}.quantity`]: normalized.quantity,
              [`batches.${index}.startingQuantity`]: normalized.quantity,
            },
            $set: set,
          },
          { new: true, runValidators: true },
        );
        if (updated) return updated;
      } else {
        const updated = await this.itemModel.findOneAndUpdate(
          { _id: id, batches: { $not: { $elemMatch: { batchNumber: batchPattern } } } },
          { $push: { batches: normalized } },
          { new: true, runValidators: true },
        );
        if (updated) return updated;
      }
    }
    throw new BadRequestException('Batch changed while adding stock; please retry');
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
    await this.ensurePersistedBatchIds(id);
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

    const batch = item.batches[batchIndex];
    if (dto.quantity != null && dto.expectedQuantity == null) {
      throw new BadRequestException('Expected quantity is required when changing stock');
    }
    if (dto.quantity != null && Number(batch.quantity) !== dto.expectedQuantity) {
      throw new BadRequestException('Stock changed. Refresh the batch before saving');
    }
    const updates: Record<string, unknown> = {};
    for (const field of ['mrp', 'purchaseRate', 'unitPrice', 'quantity', 'startingQuantity', 'supplier', 'packing', 'stripCount', 'gst', 'status'] as const) {
      if (dto[field] != null) updates[`batches.${batchIndex}.${field}`] = dto[field];
    }
    if (dto.expiryDate != null) updates[`batches.${batchIndex}.expiryDate`] = new Date(dto.expiryDate);
    if (!Object.keys(updates).length) return item;

    const filter: Record<string, unknown> = {
      _id: id,
      [`batches.${batchIndex}._id`]: (batch as any)._id,
    };
    if (dto.quantity != null) filter[`batches.${batchIndex}.quantity`] = dto.expectedQuantity;
    const updated = await this.itemModel.findOneAndUpdate(
      filter,
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!updated) throw new BadRequestException('Stock changed. Refresh the batch before saving');
    return updated;
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
    await this.ensurePersistedBatchIds(id);
    const item = await this.itemModel.findById(id);
    if (!item) {
      throw new BadRequestException('Item is not available');
    }

    const batchIndex = this.findBatchIndex(item.batches, batchId, batchId);

    if (batchIndex === -1) {
      throw new BadRequestException('Batch not found');
    }

    const target = item.batches[batchIndex];
    const updated = await this.itemModel.findOneAndUpdate(
      { _id: id, [`batches.${batchIndex}._id`]: (target as any)._id },
      { $pull: { batches: { _id: (target as any)._id } } },
      { new: true },
    );
    if (!updated) throw new BadRequestException('Batch changed. Refresh and retry');
    return updated;
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
