"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = __importStar(require("mongoose"));
const mongoose_2 = require("@nestjs/mongoose");
const item_schema_1 = require("./schemas/item.schema");
const json2csv_1 = require("json2csv");
const users_service_1 = require("../../users/users.service");
const user_schema_1 = require("../../users/schemas/user.schema");
const configuration_1 = __importDefault(require("../../config/configuration"));
const ACTIVE_STOCK_SUM = {
    $sum: {
        $map: {
            input: {
                $filter: {
                    input: { $ifNull: ['$batches', []] },
                    as: 'b',
                    cond: { $ne: ['$$b.isActive', false] },
                },
            },
            as: 'ab',
            in: { $ifNull: ['$$ab.quantity', 0] },
        },
    },
};
function isBatchActive(batch) {
    return batch?.isActive !== false;
}
function sumActiveQuantity(batches) {
    return (batches || []).reduce((sum, b) => {
        if (!isBatchActive(b))
            return sum;
        return sum + (Number(b.quantity) || 0);
    }, 0);
}
let ItemsService = class ItemsService {
    itemModel;
    usersService;
    constructor(itemModel, usersService) {
        this.itemModel = itemModel;
        this.usersService = usersService;
    }
    async resolvePharmacyScope(user) {
        const role = String(user.role || '');
        if (user.role === user_schema_1.UserRole.ADMIN ||
            role === 'Super Admin' ||
            role === 'SUPER_ADMIN') {
            return null;
        }
        if (user.role === user_schema_1.UserRole.PHARMACY ||
            user.role === user_schema_1.UserRole.PHARMACY_WHOLESALER) {
            return user.id;
        }
        return this.resolveInventoryPharmacyId();
    }
    async resolveInventoryPharmacyId() {
        const configured = String((0, configuration_1.default)().in_house_pharmacy_id || '').trim();
        if (configured && mongoose_1.default.isValidObjectId(configured)) {
            const configuredId = new mongoose_1.default.Types.ObjectId(configured);
            const ownsInventory = await this.itemModel.exists({
                pharmacy: configuredId,
                status: { $ne: item_schema_1.ItemStatus.Deleted },
            });
            if (ownsInventory)
                return configuredId;
        }
        const [top] = await this.itemModel.aggregate([
            {
                $match: {
                    status: { $ne: item_schema_1.ItemStatus.Deleted },
                    pharmacy: { $exists: true, $ne: null },
                },
            },
            { $group: { _id: '$pharmacy', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 },
        ]);
        if (top?._id && mongoose_1.default.isValidObjectId(top._id)) {
            return new mongoose_1.default.Types.ObjectId(String(top._id));
        }
        return null;
    }
    findBatch(item, batchId) {
        const key = decodeURIComponent(batchId || '').trim();
        return (item.batches || []).find((b) => {
            if (b._id?.toString() === key)
                return true;
            if (b.batchNumber &&
                b.batchNumber.toString().toLowerCase() === key.toLowerCase()) {
                return true;
            }
            return false;
        });
    }
    async pharmacyFilter(user) {
        const pharmacyId = await this.resolvePharmacyScope(user);
        return pharmacyId ? { pharmacy: pharmacyId } : {};
    }
    async assertItemAccess(id, user) {
        if (!mongoose_1.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException('Invalid item ID.');
        }
        const item = await this.itemModel.findById(id).select('pharmacy').lean();
        if (!item) {
            throw new common_1.NotFoundException('Item not found.');
        }
        const scope = await this.resolvePharmacyScope(user);
        if (scope &&
            item.pharmacy &&
            item.pharmacy.toString() !== scope.toString()) {
            throw new common_1.ForbiddenException('You do not have access to this item.');
        }
        return item;
    }
    async generateUniqueSKU() {
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
        let sku;
        let exists = true;
        do {
            sku = `${prefix}${nextNumber.toString().padStart(5, '0')}`;
            const existing = await this.itemModel.exists({ sku });
            exists = !!existing;
            if (exists)
                nextNumber++;
        } while (exists);
        return sku;
    }
    async addItems(pharmacy, addItemDto) {
        if (!addItemDto.sku) {
            addItemDto.sku = await this.generateUniqueSKU();
        }
        else {
            const found = await this.itemModel
                .findOne({ sku: addItemDto.sku })
                .lean();
            if (found) {
                throw new common_1.BadRequestException('This SKU is already assigned to another product.');
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
        const openingQty = addItemDto.openingStockQuantity ?? addItemDto.quantity ?? 0;
        const batchNumber = addItemDto.batchNumber || (openingQty > 0 ? 'BATCH-01' : undefined);
        const data = await this.itemModel.create({
            name: addItemDto.name,
            pharmacy,
            generic: addItemDto.generic,
            hsnCode: addItemDto.hsnCode || '-',
            sku: addItemDto.sku,
            category: addItemDto.category,
            manufacturer: addItemDto.manufacturer || '-',
            rackLocation: addItemDto.rackLocation || '-',
            status: addItemDto.status || item_schema_1.ItemStatus.Active,
            batches: [],
        });
        if (batchNumber) {
            const updatedItem = await this.addBatchItems(data._id, {
                batchNumber,
                expiryDate: addItemDto.expiryDate
                    ? new Date(addItemDto.expiryDate).toISOString()
                    : new Date().toISOString(),
                purchasePrice: addItemDto.purchasePrice || 0,
                quantity: openingQty,
                supplier: addItemDto.supplier || '-',
                packing: addItemDto.packing || 0,
                stripCount: addItemDto.stripCount ||
                    addItemDto.noOfPacking ||
                    addItemDto.noOfpacking ||
                    0,
                mrp: addItemDto.mrp || 0,
                unitPrice: addItemDto.unitPrice || 0,
                gst: addItemDto.gst || 0,
            });
            return updatedItem;
        }
        return data;
    }
    async getItems(query, user) {
        const { page = 1, limit = 10, q, category, stock, lowStockThreshold, lowStockItemsView, slowMovingItemsView, sortBy = 'createdAt', orderBy = 'desc', } = query;
        const skip = (page - 1) * limit;
        const scopeFilter = await this.pharmacyFilter(user);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const computeSoldInLast30Days = (item) => {
            if (!item.soldHistory || !Array.isArray(item.soldHistory))
                return 0;
            return item.soldHistory.reduce((sum, entry) => {
                if (!entry || !entry.date)
                    return sum;
                const d = new Date(entry.date);
                if (d >= thirtyDaysAgo) {
                    return sum + (Number(entry.quantity) || 0);
                }
                return sum;
            }, 0);
        };
        let filter = { ...scopeFilter };
        if (q) {
            const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const searchRegex = { $regex: escaped, $options: 'i' };
            filter.$or = [
                { name: searchRegex },
                { sku: searchRegex },
                { generic: searchRegex },
            ];
        }
        if (category) {
            filter.category = category;
        }
        if (stock && !lowStockItemsView && !slowMovingItemsView) {
            filter.$and = filter.$and || [];
            if (stock === 'Instock') {
                filter.$and.push({
                    $expr: { $gte: [ACTIVE_STOCK_SUM, 20] },
                });
            }
            else if (stock === 'Low') {
                filter.$and.push({
                    $expr: {
                        $and: [
                            { $gt: [ACTIVE_STOCK_SUM, 0] },
                            { $lt: [ACTIVE_STOCK_SUM, 20] },
                        ],
                    },
                });
            }
            else if (stock === 'Out') {
                filter.$and.push({
                    $expr: { $lte: [ACTIVE_STOCK_SUM, 0] },
                });
            }
        }
        if (lowStockItemsView &&
            !slowMovingItemsView &&
            (stock === 'Low' || stock === 'Out' || !stock)) {
            filter.$and = filter.$and || [];
            filter.$and.push({
                $expr: {
                    $lte: [ACTIVE_STOCK_SUM, Number(lowStockThreshold ?? 20)],
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
        filter.status = { $ne: item_schema_1.ItemStatus.Deleted };
        const shouldCountLowStock = stock === 'Low' || stock === 'Out' || !stock;
        const lowStockFilter = {
            ...filter,
            $expr: {
                $lte: [ACTIVE_STOCK_SUM, Number(lowStockThreshold ?? 20)],
            },
        };
        const activeItemsForCount = await this.itemModel
            .find({
            ...scopeFilter,
            status: { $ne: item_schema_1.ItemStatus.Deleted },
            $expr: { $gt: [ACTIVE_STOCK_SUM, 0] },
        })
            .lean();
        const slowMovingCount = activeItemsForCount.filter((it) => computeSoldInLast30Days(it) <= 10).length;
        let items = [];
        let total = 0;
        if (slowMovingItemsView) {
            const candidateFilter = {
                ...filter,
                $expr: { $gt: [ACTIVE_STOCK_SUM, 0] },
            };
            const candidateItems = await this.itemModel.find(candidateFilter).lean();
            const mappedCandidates = candidateItems
                .map((it) => ({
                ...it,
                quantity: sumActiveQuantity(it.batches),
                soldInLast30Days: computeSoldInLast30Days(it),
            }))
                .filter((it) => it.soldInLast30Days <= 10);
            mappedCandidates.sort((a, b) => {
                if (a.soldInLast30Days !== b.soldInLast30Days) {
                    return a.soldInLast30Days - b.soldInLast30Days;
                }
                return b.quantity - a.quantity;
            });
            total = mappedCandidates.length;
            items = mappedCandidates.slice(skip, skip + limit);
        }
        else {
            const sortObj = q
                ? { name: 1, [sortBy]: orderBy === 'asc' ? 1 : -1 }
                : { [sortBy]: orderBy === 'asc' ? 1 : -1 };
            const [rawItems, count] = await Promise.all([
                this.itemModel
                    .find(filter)
                    .sort(sortObj)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                this.itemModel.countDocuments(filter),
            ]);
            total = count;
            items = rawItems.map((it) => ({
                ...it,
                quantity: sumActiveQuantity(it.batches),
                soldInLast30Days: computeSoldInLast30Days(it),
            }));
        }
        const lowStockCount = shouldCountLowStock
            ? await this.itemModel.countDocuments(lowStockFilter)
            : 0;
        return { items, data: items, total, lowStockCount, slowMovingCount };
    }
    async getItem(id, user) {
        if (user) {
            await this.assertItemAccess(id, user);
        }
        else if (!mongoose_1.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException('Invalid item ID.');
        }
        const data = await this.itemModel.findById(id).lean();
        if (!data) {
            throw new common_1.NotFoundException('Item not found.');
        }
        return {
            ...data,
            quantity: sumActiveQuantity(data.batches),
        };
    }
    async updateItem(id, addItemDto, user) {
        await this.assertItemAccess(id, user);
        const data = await this.itemModel
            .findByIdAndUpdate(id, addItemDto, { new: true, runValidators: true })
            .lean();
        if (!data) {
            throw new common_1.NotFoundException('Item not found.');
        }
        return data;
    }
    async deleteItem(id, user) {
        await this.assertItemAccess(id, user);
        const data = await this.itemModel
            .findByIdAndUpdate(id, { status: item_schema_1.ItemStatus.Deleted }, { new: true, runValidators: true })
            .lean();
        if (!data) {
            throw new common_1.NotFoundException('Item not found.');
        }
        return data;
    }
    async exportCsv(user) {
        const items = await this.itemModel
            .find({
            ...(await this.pharmacyFilter(user)),
            status: { $ne: item_schema_1.ItemStatus.Deleted },
        })
            .lean()
            .exec();
        const csv = (0, json2csv_1.parse)(items);
        const filename = `inventory_${new Date().toISOString().slice(0, 10)}.csv`;
        return { csv, filename };
    }
    async decreaseItem(id, quantity, user, customerName, customerPhone, doctorName, pharmacistName, patientMrn, batchNumber) {
        const allowNegativeStock = await this.usersService.getPharmacyInventoryAllowNegativeStock(user);
        const item = await this.itemModel.findById(id);
        if (!item) {
            throw new common_1.BadRequestException('Item is not available');
        }
        let effectiveUnitPrice = 0;
        if (batchNumber && item.batches && item.batches.length > 0) {
            const batch = item.batches.find((b) => b.batchNumber &&
                b.batchNumber.toLowerCase() === batchNumber.trim().toLowerCase());
            if (!batch) {
                throw new common_1.BadRequestException('Batch not found.');
            }
            if (!isBatchActive(batch)) {
                throw new common_1.BadRequestException('Batch is inactive and cannot be sold.');
            }
            batch.quantity = allowNegativeStock
                ? (batch.quantity || 0) - quantity
                : Math.max((batch.quantity || 0) - quantity, 0);
            if (batch.unitPrice) {
                effectiveUnitPrice = batch.unitPrice;
            }
        }
        else if (item.batches && item.batches.length > 0) {
            throw new common_1.BadRequestException(`Select a batch for ${item.name} before completing the order.`);
        }
        else {
            throw new common_1.BadRequestException(`No batch available for ${item.name}. Add a batch before completing the order.`);
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
    async increaseItem(id, quantity) {
        const item = await this.itemModel.findById(id);
        if (!item) {
            throw new common_1.BadRequestException('Item is not available');
        }
        if (item.batches && item.batches.length > 0) {
            const batch = item.batches.find((b) => isBatchActive(b)) || item.batches[0];
            batch.quantity = (Number(batch.quantity) || 0) + quantity;
            await item.save();
        }
        return item;
    }
    async addBatchItems(id, batchData, user) {
        if (user) {
            await this.assertItemAccess(id, user);
        }
        const item = await this.itemModel.findById(id);
        if (!item) {
            throw new common_1.BadRequestException('Item is not available');
        }
        const unitPrice = Number(batchData.unitPrice ?? 0);
        const mrp = Number(batchData.mrp ?? 0);
        const purchasePrice = Number(batchData.purchasePrice ?? 0);
        const packing = Number(batchData.packing ?? 0);
        const stripCount = Number(batchData.stripCount ?? 0);
        const gst = Number(batchData.gst ?? 0);
        const quantity = Number(batchData.quantity ?? 0);
        const expiryDate = batchData.expiryDate
            ? new Date(batchData.expiryDate)
            : new Date();
        if (!item.batches) {
            item.batches = [];
        }
        const existingBatchIndex = item.batches.findIndex((b) => b.batchNumber &&
            b.batchNumber.toLowerCase() === batchData.batchNumber.trim().toLowerCase());
        if (existingBatchIndex >= 0) {
            const b = item.batches[existingBatchIndex];
            b.quantity = (Number(b.quantity) || 0) + quantity;
            b.expiryDate = expiryDate;
            if (purchasePrice > 0)
                b.purchasePrice = purchasePrice;
            if (unitPrice > 0)
                b.unitPrice = unitPrice;
            if (mrp > 0)
                b.mrp = mrp;
            if (packing > 0)
                b.packing = packing;
            if (stripCount > 0)
                b.stripCount = stripCount;
            if (gst >= 0)
                b.gst = gst;
            if (batchData.supplier && batchData.supplier !== '-')
                b.supplier = batchData.supplier;
        }
        else {
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
            });
        }
        await item.save();
        return item;
    }
    async getSuppliers(user) {
        const batchSuppliers = await this.itemModel
            .distinct('batches.supplier', await this.pharmacyFilter(user))
            .lean();
        return batchSuppliers.filter((supplier) => supplier && supplier !== '' && supplier !== '-');
    }
    async updateBatch(itemId, batchId, data, user) {
        await this.assertItemAccess(itemId, user);
        const item = await this.itemModel.findById(itemId);
        if (!item)
            throw new common_1.BadRequestException('Item not found');
        const batch = this.findBatch(item, batchId);
        if (!batch)
            throw new common_1.BadRequestException('Batch not found');
        if (data.batchNumber !== undefined)
            batch.batchNumber = data.batchNumber;
        if (data.expiryDate !== undefined)
            batch.expiryDate = new Date(data.expiryDate);
        if (data.quantity !== undefined)
            batch.quantity = Number(data.quantity);
        if (data.packing !== undefined)
            batch.packing = Number(data.packing);
        if (data.stripCount !== undefined)
            batch.stripCount = Number(data.stripCount);
        if (data.mrp !== undefined)
            batch.mrp = Number(data.mrp);
        const unitPrice = data.unitPrice !== undefined
            ? Number(data.unitPrice)
            : data.saleRate !== undefined
                ? Number(data.saleRate)
                : undefined;
        if (unitPrice !== undefined) {
            batch.unitPrice = unitPrice;
            batch.saleRate = unitPrice;
        }
        const purchasePrice = data.purchasePrice !== undefined
            ? Number(data.purchasePrice)
            : data.purchaseRate !== undefined
                ? Number(data.purchaseRate)
                : undefined;
        if (purchasePrice !== undefined) {
            batch.purchasePrice = purchasePrice;
            batch.purchaseRate = purchasePrice;
        }
        if (data.gst !== undefined)
            batch.gst = Number(data.gst);
        if (data.supplier !== undefined)
            batch.supplier = data.supplier;
        await item.save();
        return item;
    }
    async toggleBatchStatus(itemId, batchId, user) {
        await this.assertItemAccess(itemId, user);
        const item = await this.itemModel.findById(itemId);
        if (!item)
            throw new common_1.BadRequestException('Item not found');
        const batch = this.findBatch(item, batchId);
        if (!batch)
            throw new common_1.BadRequestException('Batch not found');
        const current = batch.isActive !== false &&
            String(batch.status || 'active').toLowerCase() !== 'inactive';
        batch.isActive = !current;
        batch.status = !current ? 'active' : 'inactive';
        await item.save();
        return item;
    }
    async getInventoryStatistics(user, lowStockThreshold = 20) {
        const scopeFilter = await this.pharmacyFilter(user);
        const filter = {
            ...scopeFilter,
            status: { $ne: item_schema_1.ItemStatus.Deleted },
        };
        const items = await this.itemModel
            .find(filter)
            .lean()
            .exec();
        let totalInventoryValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;
        const itemStats = items.map((item) => {
            const totalQuantity = sumActiveQuantity(item.batches);
            const itemValue = (item.batches || []).reduce((sum, batch) => {
                if (!isBatchActive(batch))
                    return sum;
                return sum + ((Number(batch.quantity) || 0) * (Number(batch.unitPrice) || 0));
            }, 0);
            totalInventoryValue += itemValue;
            if (totalQuantity === 0) {
                outOfStockCount++;
            }
            else if (totalQuantity < lowStockThreshold) {
                lowStockCount++;
            }
            return {
                _id: item._id,
                name: item.name,
                totalQuantity,
                itemValue: Math.round(itemValue * 100) / 100,
                soldQuantity: item.soldQuantity || 0,
            };
        });
        const topMoving = itemStats
            .sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0))
            .slice(0, 5);
        const lowestMoving = itemStats
            .filter((item) => item.soldQuantity > 0)
            .sort((a, b) => (a.soldQuantity || 0) - (b.soldQuantity || 0))
            .slice(0, 5);
        return {
            totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
            lowStockCount,
            outOfStockCount,
            topMoving,
            lowestMoving,
        };
    }
};
exports.ItemsService = ItemsService;
exports.ItemsService = ItemsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(item_schema_1.Item.name)),
    __metadata("design:paramtypes", [mongoose_1.Model,
        users_service_1.UsersService])
], ItemsService);
//# sourceMappingURL=items.service.js.map