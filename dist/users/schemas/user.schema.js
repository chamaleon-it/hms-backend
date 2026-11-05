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
exports.UserSchema = exports.User = exports.Availability = exports.Round = exports.UserStatus = exports.UserRole = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var UserRole;
(function (UserRole) {
    UserRole["NOT_ASSIGNED"] = "Not assigned";
    UserRole["DOCTOR"] = "Doctor";
    UserRole["PHARMACY"] = "Pharmacy";
    UserRole["PHARMACY_WHOLESALER"] = "Pharmacy Wholesaler";
    UserRole["LAB"] = "Lab";
    UserRole["ADMIN"] = "Admin";
    UserRole["RECEPTION"] = "Reception";
    UserRole["ACCOUNTANT"] = "Accountant";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["PENDING"] = "Pending";
    UserStatus["ACTIVE"] = "Active";
    UserStatus["INACTIVE"] = "Inactive";
    UserStatus["BLOCKED"] = "Blocked";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
let Round = class Round {
    label;
    start;
    end;
};
exports.Round = Round;
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true }),
    __metadata("design:type", String)
], Round.prototype, "label", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true }),
    __metadata("design:type", String)
], Round.prototype, "start", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true }),
    __metadata("design:type", String)
], Round.prototype, "end", void 0);
exports.Round = Round = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], Round);
let Availability = class Availability {
    startDate;
    endDate;
    startTime;
    endTime;
    days;
    rounds;
};
exports.Availability = Availability;
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Availability.prototype, "startDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Availability.prototype, "endDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true, default: null }),
    __metadata("design:type", Object)
], Availability.prototype, "startTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true, default: null }),
    __metadata("design:type", Object)
], Availability.prototype, "endTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Availability.prototype, "days", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [mongoose_1.SchemaFactory.createForClass(Round)], default: [] }),
    __metadata("design:type", Array)
], Availability.prototype, "rounds", void 0);
exports.Availability = Availability = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], Availability);
let User = class User {
    name;
    username;
    email;
    password;
    lastLogin;
    role;
    status;
    refreshToken;
    phoneNumber;
    address;
    hospital;
    specialization;
    department;
    designation;
    qualification;
    licenseNo;
    signature;
    profilePic;
    emailVerified;
    isDeleted;
    consultationValues;
    consultationFee;
    availability;
    pharmacy;
    lab;
    pharmacyWholesaler;
};
exports.User = User;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
        minlength: 3,
        match: [
            /^[a-zA-Z0-9_]+$/,
            'Username can only contain alphanumeric characters and underscores',
        ],
    }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, select: false }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], User.prototype, "lastLogin", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(UserRole),
        default: UserRole.NOT_ASSIGNED,
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(UserStatus),
        default: UserStatus.PENDING,
    }),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        default: null,
        select: false,
    }),
    __metadata("design:type", String)
], User.prototype, "refreshToken", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: null }),
    __metadata("design:type", String)
], User.prototype, "phoneNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: null }),
    __metadata("design:type", String)
], User.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: null }),
    __metadata("design:type", String)
], User.prototype, "hospital", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: null }),
    __metadata("design:type", String)
], User.prototype, "specialization", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: null }),
    __metadata("design:type", String)
], User.prototype, "department", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: null }),
    __metadata("design:type", String)
], User.prototype, "designation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: null }),
    __metadata("design:type", String)
], User.prototype, "qualification", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: null }),
    __metadata("design:type", String)
], User.prototype, "licenseNo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: null }),
    __metadata("design:type", String)
], User.prototype, "signature", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: null }),
    __metadata("design:type", String)
], User.prototype, "profilePic", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "emailVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isDeleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null, select: false }),
    __metadata("design:type", String)
], User.prototype, "consultationValues", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "consultationFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_1.SchemaFactory.createForClass(Availability), default: null }),
    __metadata("design:type", Object)
], User.prototype, "availability", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            general: {
                owner: { type: String, default: null, trim: true },
                gstin: { type: String, default: null, trim: true, uppercase: true },
            },
            billing: {
                prefix: { type: String, default: 'INV', trim: true, uppercase: true },
                defaultGst: { type: Number, default: 5 },
                roundOff: { type: Boolean, default: false },
                autoPrintAfterSave: { type: Boolean, default: false },
                autoGenerateBill: { type: Boolean, default: false },
                autoGeneratePrescription: { type: Boolean, default: false },
            },
            inventory: {
                lowStockThreshold: { type: Number, default: 20 },
                expiryAlert: { type: Number, default: 90 },
                allowNegativeStock: { type: Boolean, default: false },
            },
            notifications: {
                whatsapp: { type: Boolean, default: false },
                sms: { type: Boolean, default: false },
                inApp: { type: Boolean, default: false },
                note: { type: String, default: null, trim: true },
            },
        },
    }),
    __metadata("design:type", Object)
], User.prototype, "pharmacy", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            general: {
                owner: { type: String, default: null, trim: true },
                gstin: { type: String, default: null, trim: true, uppercase: true },
            },
            catalogue: {
                showProfilesOnPatientBill: { type: Boolean, default: false },
                allowEditingPanelComposition: { type: Boolean, default: false },
            },
            billing: {
                prefix: { type: String, default: 'INV', trim: true, uppercase: true },
                defaultGst: { type: Number, default: 5 },
                roundOff: { type: Boolean, default: false },
                autoPrintAfterSave: { type: Boolean, default: false },
            },
            notifications: {
                whatsapp: { type: Boolean, default: false },
                sms: { type: Boolean, default: false },
                inApp: { type: Boolean, default: false },
                note: { type: String, default: null, trim: true },
            },
            reportLayout: {
                type: String,
                default: 'Classic',
                enum: ['Classic', 'Modern'],
            },
            panelPerPage: { type: Boolean, default: false },
        },
    }),
    __metadata("design:type", Object)
], User.prototype, "lab", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            general: {
                contactPerson: { type: String, default: null },
                gstin: { type: String, default: null, uppercase: true },
            },
            pricing: {
                defaultMargin: { type: Number, default: 18 },
                minOrderValue: { type: Number, default: 5000 },
                creditPeriod: { type: Number, default: 30 },
                allowCreditOrder: { type: Boolean, default: false },
            },
            logistics: {
                sameDayDispatchCutOf: { type: String, default: '16:00' },
                defaultCourier: { type: String, default: null },
                returnWindow: { type: Number, default: 7 },
                allowPartialDispatch: { type: Boolean, default: false },
                autoMergeOrders: { type: Boolean, default: false },
            },
            notifications: {
                whatsapp: { type: Boolean, default: false },
                email: { type: Boolean, default: false },
                sms: { type: Boolean, default: false },
                inApp: { type: Boolean, default: false },
                note: { type: String, default: null },
            },
        },
    }),
    __metadata("design:type", Object)
], User.prototype, "pharmacyWholesaler", void 0);
exports.User = User = __decorate([
    (0, mongoose_1.Schema)({
        versionKey: false,
        timestamps: true,
    })
], User);
exports.UserSchema = mongoose_1.SchemaFactory.createForClass(User);
//# sourceMappingURL=user.schema.js.map