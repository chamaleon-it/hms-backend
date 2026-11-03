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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TherapySchema = exports.Therapy = exports.SubTherapySchema = exports.SubTherapy = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importStar(require("mongoose"));
let SubTherapy = class SubTherapy {
    _id;
    name;
    code;
    description;
    status;
    isDeleted;
};
exports.SubTherapy = SubTherapy;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, default: () => new mongoose_2.Types.ObjectId() }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], SubTherapy.prototype, "_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SubTherapy.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], SubTherapy.prototype, "code", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], SubTherapy.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'Active' }),
    __metadata("design:type", String)
], SubTherapy.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], SubTherapy.prototype, "isDeleted", void 0);
exports.SubTherapy = SubTherapy = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, versionKey: false })
], SubTherapy);
exports.SubTherapySchema = mongoose_1.SchemaFactory.createForClass(SubTherapy);
let Therapy = class Therapy {
    name;
    code;
    description;
    hasSubTherapies;
    subTherapies;
    status;
    isDeleted;
};
exports.Therapy = Therapy;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Therapy.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Therapy.prototype, "code", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Therapy.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Therapy.prototype, "hasSubTherapies", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.SubTherapySchema], default: [] }),
    __metadata("design:type", Array)
], Therapy.prototype, "subTherapies", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'Active' }),
    __metadata("design:type", String)
], Therapy.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Therapy.prototype, "isDeleted", void 0);
exports.Therapy = Therapy = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, versionKey: false })
], Therapy);
exports.TherapySchema = mongoose_1.SchemaFactory.createForClass(Therapy);
//# sourceMappingURL=therapy.schema.js.map