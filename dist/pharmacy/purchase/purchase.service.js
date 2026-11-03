"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const purchase_schema_1 = require("./schemas/purchase.schema");
const mongoose_2 = require("mongoose");
let PurchaseService = class PurchaseService {
    purchaseModel;
    constructor(purchaseModel) {
        this.purchaseModel = purchaseModel;
    }
    async createPurchase(createPurchaseDto) {
        const mrn = await this.generateUniqueMRN();
        const data = await this.purchaseModel.create({ ...createPurchaseDto, mrn });
        return data;
    }
    async findAll(findAllPurchaseDto) {
        const { pharmacy, status, wholesaler, mrn } = findAllPurchaseDto;
        const limit = Number(findAllPurchaseDto.limit ?? 100);
        const page = Number(findAllPurchaseDto.page ?? 1);
        const query = {};
        if (pharmacy)
            query.pharmacy = pharmacy;
        if (status)
            query.status = status;
        if (wholesaler)
            query.wholesaler = wholesaler;
        if (mrn)
            query.mrn = { $regex: '^' + mrn, $options: 'i' };
        const total = await this.purchaseModel.countDocuments(query);
        const data = await this.purchaseModel
            .find(query)
            .populate('wholesaler', 'name email phoneNumber address')
            .populate('pharmacy', 'name email phoneNumber address')
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })
            .lean();
        return {
            data,
            total,
            page,
            limit,
        };
    }
    async generateUniqueMRN() {
        const prefix = 'PRC-';
        const lastRecord = await this.purchaseModel
            .findOne({ mrn: { $regex: `^${prefix}\\d+$` } })
            .collation({ locale: 'en_US', numericOrdering: true })
            .sort({ mrn: -1 })
            .select('mrn')
            .lean()
            .exec();
        let nextNumber = 1;
        if (lastRecord && lastRecord.mrn) {
            const match = lastRecord.mrn.match(new RegExp(`^${prefix}(\\d+)$`));
            if (match && match[1]) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }
        let mrn;
        let exists = true;
        do {
            mrn = `${prefix}${nextNumber.toString().padStart(5, '0')}`;
            const existing = await this.purchaseModel.exists({ mrn });
            exists = !!existing;
            if (exists)
                nextNumber++;
        } while (exists);
        return mrn;
    }
};
exports.PurchaseService = PurchaseService;
exports.PurchaseService = PurchaseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(purchase_schema_1.Purchase.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], PurchaseService);
//# sourceMappingURL=purchase.service.js.map