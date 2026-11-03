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
exports.SyncLogSchema = exports.SyncLog = exports.CollectionSyncMetricSchema = exports.CollectionSyncMetric = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let CollectionSyncMetric = class CollectionSyncMetric {
    name;
    count;
    error;
};
exports.CollectionSyncMetric = CollectionSyncMetric;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CollectionSyncMetric.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], CollectionSyncMetric.prototype, "count", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], CollectionSyncMetric.prototype, "error", void 0);
exports.CollectionSyncMetric = CollectionSyncMetric = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], CollectionSyncMetric);
exports.CollectionSyncMetricSchema = mongoose_1.SchemaFactory.createForClass(CollectionSyncMetric);
let SyncLog = class SyncLog {
    user;
    status;
    startedAt;
    completedAt;
    durationMs;
    totalCollections;
    totalDocuments;
    collections;
    targetHost;
    error;
};
exports.SyncLog = SyncLog;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'User', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], SyncLog.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['In Progress', 'Success', 'Failed'], default: 'In Progress' }),
    __metadata("design:type", String)
], SyncLog.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], SyncLog.prototype, "startedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: false }),
    __metadata("design:type", Date)
], SyncLog.prototype, "completedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], SyncLog.prototype, "durationMs", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], SyncLog.prototype, "totalCollections", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], SyncLog.prototype, "totalDocuments", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.CollectionSyncMetricSchema], default: [] }),
    __metadata("design:type", Array)
], SyncLog.prototype, "collections", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false }),
    __metadata("design:type", String)
], SyncLog.prototype, "targetHost", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false }),
    __metadata("design:type", String)
], SyncLog.prototype, "error", void 0);
exports.SyncLog = SyncLog = __decorate([
    (0, mongoose_1.Schema)({ collection: 'database_sync_logs', timestamps: true, versionKey: false })
], SyncLog);
exports.SyncLogSchema = mongoose_1.SchemaFactory.createForClass(SyncLog);
//# sourceMappingURL=sync-log.schema.js.map