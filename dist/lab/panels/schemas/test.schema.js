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
exports.TestSchema = exports.Test = exports.RangeItem = exports.TestType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
var TestType;
(function (TestType) {
    TestType["LAB"] = "Lab";
    TestType["IMAGING"] = "Imaging";
    TestType["OTHER"] = "Other";
})(TestType || (exports.TestType = TestType = {}));
let RangeItem = class RangeItem {
    name;
    min;
    max;
    upto;
    fromAge;
    toAge;
    gender;
    dateType;
};
exports.RangeItem = RangeItem;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], RangeItem.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Number)
], RangeItem.prototype, "min", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Number)
], RangeItem.prototype, "max", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Number)
], RangeItem.prototype, "upto", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Number)
], RangeItem.prototype, "fromAge", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Number)
], RangeItem.prototype, "toAge", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['Both', 'Male', 'Female'] }),
    __metadata("design:type", String)
], RangeItem.prototype, "gender", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['Year', 'Month', 'Day'] }),
    __metadata("design:type", String)
], RangeItem.prototype, "dateType", void 0);
exports.RangeItem = RangeItem = __decorate([
    (0, mongoose_1.Schema)()
], RangeItem);
let Test = class Test {
    code;
    name;
    price;
    method;
    specimen;
    type;
    estimatedTime;
    dataType;
    range;
    unit;
    panels;
    options;
    note;
    department;
};
exports.Test = Test;
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true, default: null, type: String || null }),
    __metadata("design:type", Object)
], Test.prototype, "code", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Test.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], Test.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: null, trim: true, type: String || null }),
    __metadata("design:type", Object)
], Test.prototype, "method", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: null, trim: true, type: String || null }),
    __metadata("design:type", Object)
], Test.prototype, "specimen", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: Object.values(TestType), default: TestType.LAB }),
    __metadata("design:type", String)
], Test.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Number)
], Test.prototype, "estimatedTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'number', enum: ['number', 'text', 'boolean', 'options'] }),
    __metadata("design:type", String)
], Test.prototype, "dataType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [RangeItem], default: [] }),
    __metadata("design:type", Array)
], Test.prototype, "range", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null, trim: true }),
    __metadata("design:type", String)
], Test.prototype, "unit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [mongoose_2.default.Schema.Types.ObjectId], ref: 'Panel' }),
    __metadata("design:type", Array)
], Test.prototype, "panels", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Test.prototype, "options", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], Test.prototype, "note", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], Test.prototype, "department", void 0);
exports.Test = Test = __decorate([
    (0, mongoose_1.Schema)({ versionKey: false })
], Test);
exports.TestSchema = mongoose_1.SchemaFactory.createForClass(Test);
//# sourceMappingURL=test.schema.js.map