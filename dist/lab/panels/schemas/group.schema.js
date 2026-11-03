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
exports.GroupSchema = exports.Group = exports.GroupStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
var GroupStatus;
(function (GroupStatus) {
    GroupStatus["ACTIVE"] = "Active";
    GroupStatus["INACTIVE"] = "Inactive";
    GroupStatus["DELETED"] = "Deleted";
})(GroupStatus || (exports.GroupStatus = GroupStatus = {}));
let Group = class Group {
    name;
    price;
    status;
    tests;
    panels;
    user;
};
exports.Group = Group;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Group.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Group.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: GroupStatus, default: GroupStatus.ACTIVE }),
    __metadata("design:type", String)
], Group.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'Test' }] }),
    __metadata("design:type", Array)
], Group.prototype, "tests", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'Panel' }] }),
    __metadata("design:type", Array)
], Group.prototype, "panels", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", Object)
], Group.prototype, "user", void 0);
exports.Group = Group = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Group);
exports.GroupSchema = mongoose_1.SchemaFactory.createForClass(Group);
//# sourceMappingURL=group.schema.js.map