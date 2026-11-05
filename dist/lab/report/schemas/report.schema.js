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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportSchema = exports.Report = exports.ReportStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importStar(require("mongoose"));
const configuration_1 = __importDefault(require("../../../config/configuration"));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["UPCOMING"] = "Upcoming";
    ReportStatus["SAMPLE_COLLECTED"] = "Sample Collected";
    ReportStatus["WAITING_FOR_RESULT"] = "Waiting For Result";
    ReportStatus["COMPLETED"] = "Completed";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
let Report = class Report {
    patient;
    doctor;
    lab;
    date;
    priority;
    panels;
    groups;
    test;
    sampleType;
    sampleCollectedAt;
    testStartedAt;
    sampleId;
    extraTime;
    status;
    isDeleted;
    isFlagged;
    mrn;
    technician;
    note;
    graphs;
};
exports.Report = Report;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Report.prototype, "patient", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'User', default: null }),
    __metadata("design:type", Object)
], Report.prototype, "doctor", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        default: (0, configuration_1.default)().in_house_lab_id,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Report.prototype, "lab", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], Report.prototype, "date", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], Report.prototype, "priority", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Report.prototype, "panels", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Report.prototype, "groups", void 0);
__decorate([
    (0, mongoose_1.Prop)([
        {
            name: { type: mongoose_2.default.Schema.Types.ObjectId, ref: 'Test' },
            value: { type: mongoose_2.default.Schema.Types.Mixed, default: '' },
        },
    ]),
    __metadata("design:type", Array)
], Report.prototype, "test", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        default: null,
    }),
    __metadata("design:type", Object)
], Report.prototype, "sampleType", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Date,
        default: null,
    }),
    __metadata("design:type", Object)
], Report.prototype, "sampleCollectedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Date,
        default: null,
    }),
    __metadata("design:type", Object)
], Report.prototype, "testStartedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        default: null,
    }),
    __metadata("design:type", Object)
], Report.prototype, "sampleId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Number,
        default: 0,
    }),
    __metadata("design:type", Number)
], Report.prototype, "extraTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(ReportStatus),
        default: ReportStatus.UPCOMING,
    }),
    __metadata("design:type", String)
], Report.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Report.prototype, "isDeleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Report.prototype, "isFlagged", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, unique: true }),
    __metadata("design:type", Number)
], Report.prototype, "mrn", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], Report.prototype, "technician", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '' }),
    __metadata("design:type", String)
], Report.prototype, "note", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.Mixed, default: {} }),
    __metadata("design:type", Object)
], Report.prototype, "graphs", void 0);
exports.Report = Report = __decorate([
    (0, mongoose_1.Schema)({ versionKey: false, timestamps: true })
], Report);
exports.ReportSchema = mongoose_1.SchemaFactory.createForClass(Report);
exports.ReportSchema.index({ createdAt: -1 });
exports.ReportSchema.index({ sampleId: 1 });
exports.ReportSchema.pre('save', async function (next) {
    if (this.isNew) {
        const model = this.constructor;
        const lastReport = await model
            .findOne()
            .sort({ mrn: -1 })
            .select('mrn')
            .lean();
        this.mrn = lastReport ? lastReport.mrn + 1 : 1;
    }
    next();
});
//# sourceMappingURL=report.schema.js.map