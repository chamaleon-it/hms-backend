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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const common_1 = require("@nestjs/common");
const report_service_1 = require("./report.service");
const create_report_dto_1 = require("./dto/create-report.dto");
const auth_guard_1 = require("../../auth/auth.guard");
const get_user_decorator_1 = require("../../auth/decorators/get-user.decorator");
const result_dto_1 = require("./dto/result.dto");
const mongoose_1 = __importDefault(require("mongoose"));
const sample_collected_dto_1 = require("./dto/sample-collected.dto");
const get_report_dto_1 = require("./dto/get-report.dto");
const lis_result_dto_1 = require("./dto/lis-result.dto");
const public_decorator_1 = require("../../auth/decorators/public.decorator");
let ReportController = class ReportController {
    reportService;
    constructor(reportService) {
        this.reportService = reportService;
    }
    async createReport(dto) {
        const data = await this.reportService.createReport(dto);
        return {
            message: 'Test is created successfully',
            data,
        };
    }
    async getReport(user, dto) {
        const data = await this.reportService.getReport(user.id, dto);
        return {
            data,
            message: 'All Lab report retrieved successfully.',
        };
    }
    async sampleCollected(id, dto) {
        const data = await this.reportService.sampleCollected(id, dto);
        return {
            message: 'Sample is collected',
            data,
        };
    }
    async startTest(id) {
        const data = await this.reportService.startTest(id);
        return {
            message: 'Test is started',
            data,
        };
    }
    async deleteReport(id) {
        const data = await this.reportService.deleteReport(id);
        return {
            message: 'Report is deleted',
            data,
        };
    }
    async updateResult(dto) {
        const data = await this.reportService.updateResult(dto);
        return {
            message: 'Result updated.  ',
            data,
        };
    }
    async receiveLisResult(apiKey, dto) {
        const expected = process.env.LIS_API_KEY?.trim();
        const isProduction = process.env.NODE_ENV === 'production';
        if (!expected) {
            if (isProduction) {
                throw new common_1.UnauthorizedException('LIS API key is not configured. Refusing public LIS writes.');
            }
        }
        else if (apiKey !== expected) {
            throw new common_1.UnauthorizedException('Invalid or missing LIS API key');
        }
        const data = await this.reportService.updateFromLis(dto);
        return {
            message: 'LIS Result Received',
            data,
        };
    }
    async getPatientReports(patient) {
        const data = await this.reportService.getPatientReports(patient);
        return {
            message: 'patient lab report is fetched',
            data,
        };
    }
    async getPatients(query) {
        const { data, total } = await this.reportService.getPatients(query);
        return {
            data,
            total,
            message: 'All patient data retrieved',
        };
    }
    async getStatistics() {
        const data = await this.reportService.getStatistics();
        return {
            data,
            message: 'All statistics retrieved',
        };
    }
    async markAsFlagged(id) {
        const data = await this.reportService.markAsFlagged(id);
        return {
            message: 'Report is marked as flagged',
            data,
        };
    }
    async markAsUnflagged(id) {
        const data = await this.reportService.markAsUnflagged(id);
        return {
            message: 'Report is marked as unflagged',
            data,
        };
    }
    async resetTimer(id, dto) {
        const data = await this.reportService.resetTimer(id, dto);
        return {
            message: 'Timer is reset',
            data,
        };
    }
    async recoverReport(id) {
        const data = await this.reportService.recoverReport(id);
        return {
            message: 'Report is recovered',
            data,
        };
    }
    async repeatReport(id) {
        const data = await this.reportService.repeatReport(id);
        return {
            message: 'Report is repeated',
            data,
        };
    }
    async updateReport(id, dto) {
        const data = await this.reportService.updateReport(id, dto);
        return {
            message: 'Report is updated successfully',
            data,
        };
    }
};
exports.ReportController = ReportController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_report_dto_1.CreateReportDto]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "createReport", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, get_report_dto_1.GetReportDto]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getReport", null);
__decorate([
    (0, common_1.Post)('sample_collected/:id'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId, sample_collected_dto_1.SampleCollectedDto]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "sampleCollected", null);
__decorate([
    (0, common_1.Post)('start_test/:id'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "startTest", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "deleteReport", null);
__decorate([
    (0, common_1.Post)('result'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [result_dto_1.ResultDto]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "updateResult", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('lis-result'),
    __param(0, (0, common_1.Headers)('x-lis-api-key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, lis_result_dto_1.LisResultDto]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "receiveLisResult", null);
__decorate([
    (0, common_1.Get)(`patient/:id`),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getPatientReports", null);
__decorate([
    (0, common_1.Get)('patients'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getPatients", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Post)('mark_as_flagged/:id'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "markAsFlagged", null);
__decorate([
    (0, common_1.Post)('mark_as_unflagged/:id'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "markAsUnflagged", null);
__decorate([
    (0, common_1.Post)('reset_timer/:id'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId, Object]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "resetTimer", null);
__decorate([
    (0, common_1.Post)('recover/:id'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "recoverReport", null);
__decorate([
    (0, common_1.Post)('repeat/:id'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "repeatReport", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId, create_report_dto_1.CreateReportDto]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "updateReport", null);
exports.ReportController = ReportController = __decorate([
    (0, common_1.Controller)('lab/report'),
    __metadata("design:paramtypes", [report_service_1.ReportService])
], ReportController);
//# sourceMappingURL=report.controller.js.map