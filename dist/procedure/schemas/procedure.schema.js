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
exports.ProcedureSchema = exports.Procedure = exports.SubProcedureSchema = exports.SubProcedure = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importStar(require("mongoose"));
let SubProcedure = class SubProcedure {
    _id;
    name;
    code;
    description;
    status;
    isDeleted;
};
exports.SubProcedure = SubProcedure;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, default: () => new mongoose_2.Types.ObjectId() }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], SubProcedure.prototype, "_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SubProcedure.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], SubProcedure.prototype, "code", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], SubProcedure.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'Active' }),
    __metadata("design:type", String)
], SubProcedure.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], SubProcedure.prototype, "isDeleted", void 0);
exports.SubProcedure = SubProcedure = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, versionKey: false })
], SubProcedure);
exports.SubProcedureSchema = mongoose_1.SchemaFactory.createForClass(SubProcedure);
let Procedure = class Procedure {
    name;
    code;
    description;
    hasSubProcedures;
    subProcedures;
    status;
    isDeleted;
};
exports.Procedure = Procedure;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Procedure.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Procedure.prototype, "code", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Procedure.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Procedure.prototype, "hasSubProcedures", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.SubProcedureSchema], default: [] }),
    __metadata("design:type", Array)
], Procedure.prototype, "subProcedures", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'Active' }),
    __metadata("design:type", String)
], Procedure.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Procedure.prototype, "isDeleted", void 0);
exports.Procedure = Procedure = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, versionKey: false })
], Procedure);
exports.ProcedureSchema = mongoose_1.SchemaFactory.createForClass(Procedure);
//# sourceMappingURL=procedure.schema.js.map