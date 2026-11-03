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
exports.ReturnService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const return_schema_1 = require("./schemas/return.schema");
const mongoose_2 = __importStar(require("mongoose"));
const items_service_1 = require("../items/items.service");
const billing_schema_1 = require("../../billing/schemas/billing.schema");
const configuration_1 = __importDefault(require("../../config/configuration"));
const accounts_service_1 = require("../../accounts/accounts.service");
const account_transaction_enum_1 = require("../../accounts/enums/account-transaction.enum");
const return_bill_no_1 = require("./return-bill-no");
let ReturnService = class ReturnService {
    returnModel;
    billingModel;
    itemsService;
    accountsService;
    constructor(returnModel, billingModel, itemsService, accountsService) {
        this.returnModel = returnModel;
        this.billingModel = billingModel;
        this.itemsService = itemsService;
        this.accountsService = accountsService;
    }
    async create(createReturnDto) {
        const saleBillNo = saleBillNumber(createReturnDto.billNo);
        const returnTotal = createReturnDto.items.reduce((acc, item) => acc + Number(item.unitPrice) * Number(item.quantity), 0);
        const billItems = await Promise.all(createReturnDto.items.map(async (e) => {
            const item = await this.itemsService.getItem(e.name);
            const quantity = e.quantity;
            const total = e.unitPrice * quantity;
            return {
                name: item.name,
                quantity,
                unitPrice: e.unitPrice,
                total,
            };
        }));
        let data;
        let billNo = '';
        for (let attempt = 0; attempt < 5; attempt++) {
            billNo = await this.allocateReturnBillNo();
            try {
                data = await this.returnModel.create({
                    ...createReturnDto,
                    billNo,
                    saleBillNo,
                });
                await this.billingModel.create({
                    patient: createReturnDto.patient,
                    user: (0, configuration_1.default)().in_house_pharmacy_id,
                    items: billItems,
                    mrn: billNo,
                    salesMRN: saleBillNo,
                    transactionType: 'Return',
                    billingCategory: 'Pharmacy',
                    cash: returnTotal,
                });
                break;
            }
            catch (error) {
                if (data && '_id' in data) {
                    await this.returnModel.deleteOne({ _id: data._id });
                    data = undefined;
                }
                if (!isDuplicateKey(error) || attempt === 4) {
                    throw error;
                }
            }
        }
        try {
            await this.accountsService.recordTransaction({
                type: account_transaction_enum_1.TransactionType.Expense,
                category: account_transaction_enum_1.ExpenseCategory.SalesReturn,
                amount: returnTotal,
                description: `Pharmacy Sales Return Bill #${billNo}`,
                paymentMethod: account_transaction_enum_1.PaymentMethod.Cash,
                sourceModule: account_transaction_enum_1.SourceModule.Pharmacy,
                createdBy: (0, configuration_1.default)().in_house_pharmacy_id,
                transactionDate: new Date(),
            });
        }
        catch (err) {
            console.error('Error recording account transaction for Pharmacy Return:', err);
        }
        const validReasonForQuantityAdd = [
            return_schema_1.ReturnReason.AdverseReaction,
            return_schema_1.ReturnReason.DoctorChangedRx,
            return_schema_1.ReturnReason.NotRequired,
            return_schema_1.ReturnReason.Other,
            return_schema_1.ReturnReason.QualityIssue,
            return_schema_1.ReturnReason.WrongItem,
        ];
        const items = createReturnDto.items.filter((item) => validReasonForQuantityAdd.includes(item.reason) || !item.reason);
        for (const item of items) {
            await this.itemsService.increaseItem(item.name, item.quantity);
        }
        return data;
    }
    async findAll() {
        const data = await this.returnModel
            .find()
            .sort({ createdAt: -1 })
            .populate('patient', 'name phoneNumber email address mrn')
            .populate('order', 'mrn')
            .populate('items.name', '-createdAt -updatedAt -expiryDate -purchasePrice ')
            .lean()
            .exec();
        return data;
    }
    async findOne(id) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException('Please provide a valid return id');
        }
        const data = await this.returnModel
            .findById(id)
            .populate('patient', 'name phoneNumber email address mrn')
            .populate('order', 'mrn')
            .populate('items.name', '-createdAt -updatedAt -expiryDate -purchasePrice ')
            .lean()
            .exec();
        if (!data) {
            throw new common_1.NotFoundException('Sorry no return data available for this id.');
        }
        return data;
    }
    async findByPatient(patientId) {
        if (!mongoose_2.default.isValidObjectId(patientId)) {
            throw new common_1.BadRequestException('Please provide a valid patient id');
        }
        const data = await this.returnModel
            .find({ patient: patientId })
            .populate('order', 'mrn')
            .populate('items.name', '-createdAt -updatedAt -expiryDate -purchasePrice ')
            .lean()
            .exec();
        return data;
    }
    async allocateReturnBillNo() {
        const [bills, returns] = await Promise.all([
            this.billingModel
                .find({ mrn: /^R-\d+$/ })
                .select('mrn')
                .lean()
                .exec(),
            this.returnModel
                .find({ billNo: /^R-\d+$/ })
                .select('billNo')
                .lean()
                .exec(),
        ]);
        return (0, return_bill_no_1.nextReturnBillNumber)([
            ...bills.map((bill) => bill.mrn),
            ...returns.map((entry) => entry.billNo),
        ]);
    }
};
exports.ReturnService = ReturnService;
exports.ReturnService = ReturnService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(return_schema_1.Return.name)),
    __param(1, (0, mongoose_1.InjectModel)(billing_schema_1.Billing.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        items_service_1.ItemsService,
        accounts_service_1.AccountsService])
], ReturnService);
function saleBillNumber(billNo) {
    const value = String(billNo ?? '').trim();
    if (!value || value === '-' || value === 'undefined')
        return undefined;
    return value;
}
function isDuplicateKey(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000);
}
//# sourceMappingURL=return.service.js.map