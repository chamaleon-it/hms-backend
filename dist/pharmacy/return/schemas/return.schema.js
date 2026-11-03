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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnSchema = exports.Return = exports.ReturnReason = exports.ReturnedBy = exports.RefundMode = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
var RefundMode;
(function (RefundMode) {
    RefundMode["Cash"] = "Cash";
    RefundMode["UPI"] = "UPI";
    RefundMode["AdjustNextBill"] = "Adjust in Next Bill";
})(RefundMode || (exports.RefundMode = RefundMode = {}));
var ReturnedBy;
(function (ReturnedBy) {
    ReturnedBy["Patient"] = "Patient";
    ReturnedBy["Staff"] = "Staff";
})(ReturnedBy || (exports.ReturnedBy = ReturnedBy = {}));
var ReturnReason;
(function (ReturnReason) {
    ReturnReason["DoctorChangedRx"] = "Doctor Changed Rx";
    ReturnReason["Expired"] = "Expired";
    ReturnReason["NearExpiry"] = "Near Expiry";
    ReturnReason["QualityIssue"] = "Quality Issue";
    ReturnReason["WrongItem"] = "Wrong Item";
    ReturnReason["AdverseReaction"] = "Adverse Reaction";
    ReturnReason["NotRequired"] = "Not Required";
    ReturnReason["Damaged"] = "Damaged";
    ReturnReason["Other"] = "Other";
})(ReturnReason || (exports.ReturnReason = ReturnReason = {}));
let Return = class Return {
    patient;
    order;
    refundMode;
    returnedBy;
    remarks;
    items;
    billNo;
    saleBillNo;
};
exports.Return = Return;
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: 'Patient',
    }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], Return.prototype, "patient", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.default.Schema.Types.ObjectId, ref: 'Order' }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], Return.prototype, "order", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: Object.values(RefundMode) }),
    __metadata("design:type", String)
], Return.prototype, "refundMode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: Object.values(ReturnedBy) }),
    __metadata("design:type", String)
], Return.prototype, "returnedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], Return.prototype, "remarks", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        default: () => [],
        type: [
            {
                name: {
                    type: mongoose_2.default.Schema.Types.ObjectId,
                    ref: 'Item',
                    required: true,
                },
                quantity: { type: Number, default: 0, min: 0 },
                reason: {
                    type: String,
                    enum: Object.values(ReturnReason),
                    default: ReturnReason.DoctorChangedRx,
                },
                unitPrice: { type: Number, default: 0 },
            },
        ],
    }),
    __metadata("design:type", Array)
], Return.prototype, "items", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '-' }),
    __metadata("design:type", String)
], Return.prototype, "billNo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Return.prototype, "saleBillNo", void 0);
exports.Return = Return = __decorate([
    (0, mongoose_1.Schema)({ versionKey: false, timestamps: true })
], Return);
exports.ReturnSchema = mongoose_1.SchemaFactory.createForClass(Return);
//# sourceMappingURL=return.schema.js.map