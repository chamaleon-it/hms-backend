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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierSchema = exports.Supplier = exports.SupplierStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var SupplierStatus;
(function (SupplierStatus) {
    SupplierStatus["ACTIVE"] = "Active";
    SupplierStatus["INACTIVE"] = "Inactive";
})(SupplierStatus || (exports.SupplierStatus = SupplierStatus = {}));
let Supplier = class Supplier {
    name;
    phone;
    contactPerson;
    designation;
    email;
    address;
    gstin;
    msme;
    pan;
    dlNo;
    dlExpiryDate;
    balance;
    paymentTerms;
    description;
    status;
    isDeleted;
};
exports.Supplier = Supplier;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Supplier.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Supplier.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Supplier.prototype, "contactPerson", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Supplier.prototype, "designation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Supplier.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            line1: String,
            line2: String,
            city: String,
            state: String,
        },
    }),
    __metadata("design:type", Object)
], Supplier.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Supplier.prototype, "gstin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Supplier.prototype, "msme", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Supplier.prototype, "pan", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Supplier.prototype, "dlNo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: false }),
    __metadata("design:type", Date)
], Supplier.prototype, "dlExpiryDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Supplier.prototype, "balance", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 30 }),
    __metadata("design:type", Number)
], Supplier.prototype, "paymentTerms", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Supplier.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: SupplierStatus.ACTIVE }),
    __metadata("design:type", String)
], Supplier.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Supplier.prototype, "isDeleted", void 0);
exports.Supplier = Supplier = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, versionKey: false })
], Supplier);
exports.SupplierSchema = mongoose_1.SchemaFactory.createForClass(Supplier);
//# sourceMappingURL=supplier.schema.js.map