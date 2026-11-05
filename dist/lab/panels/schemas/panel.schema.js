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
exports.PanelSchema = exports.Panel = exports.PanelStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
var PanelStatus;
(function (PanelStatus) {
    PanelStatus["ACTIVE"] = "Active";
    PanelStatus["INACTIVE"] = "Inactive";
    PanelStatus["DELETED"] = "Deleted";
})(PanelStatus || (exports.PanelStatus = PanelStatus = {}));
let Panel = class Panel {
    name;
    price;
    status;
    user;
    estimatedTime;
    method;
    specimen;
    tests;
    mainHeading;
    subheadings;
    testSubheadings;
    department;
};
exports.Panel = Panel;
__decorate([
    (0, mongoose_1.Prop)({ unique: true, required: true, trim: true }),
    __metadata("design:type", String)
], Panel.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], Panel.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(PanelStatus),
        default: PanelStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], Panel.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], Panel.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Panel.prototype, "estimatedTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false }),
    __metadata("design:type", String)
], Panel.prototype, "method", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false }),
    __metadata("design:type", String)
], Panel.prototype, "specimen", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [mongoose_2.default.Schema.Types.ObjectId], ref: 'Test', default: [] }),
    __metadata("design:type", Array)
], Panel.prototype, "tests", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Panel.prototype, "mainHeading", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Panel.prototype, "subheadings", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], Panel.prototype, "testSubheadings", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], Panel.prototype, "department", void 0);
exports.Panel = Panel = __decorate([
    (0, mongoose_1.Schema)({ versionKey: false })
], Panel);
exports.PanelSchema = mongoose_1.SchemaFactory.createForClass(Panel);
//# sourceMappingURL=panel.schema.js.map