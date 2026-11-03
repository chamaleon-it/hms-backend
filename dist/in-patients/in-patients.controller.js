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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InPatientsController = void 0;
const common_1 = require("@nestjs/common");
const in_patients_service_1 = require("./in-patients.service");
const create_in_patient_dto_1 = require("./dto/create-in-patient.dto");
const update_in_patient_dto_1 = require("./dto/update-in-patient.dto");
const auth_guard_1 = require("../auth/auth.guard");
let InPatientsController = class InPatientsController {
    inPatientsService;
    constructor(inPatientsService) {
        this.inPatientsService = inPatientsService;
    }
    create(createInPatientDto, req) {
        return this.inPatientsService.create(createInPatientDto, req.user);
    }
    findAll(query) {
        return this.inPatientsService.findAll(query);
    }
    findOne(id) {
        return this.inPatientsService.findOne(id);
    }
    update(id, updateInPatientDto, req) {
        return this.inPatientsService.update(id, updateInPatientDto, req.user);
    }
    addNote(id, body, req) {
        return this.inPatientsService.addIpNote(id, body, req.user);
    }
    remove(id) {
        return this.inPatientsService.remove(id);
    }
};
exports.InPatientsController = InPatientsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_in_patient_dto_1.CreateInPatientDto, Object]),
    __metadata("design:returntype", void 0)
], InPatientsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InPatientsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InPatientsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_in_patient_dto_1.UpdateInPatientDto, Object]),
    __metadata("design:returntype", void 0)
], InPatientsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/notes'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], InPatientsController.prototype, "addNote", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InPatientsController.prototype, "remove", null);
exports.InPatientsController = InPatientsController = __decorate([
    (0, common_1.Controller)('in-patients'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [in_patients_service_1.InPatientsService])
], InPatientsController);
//# sourceMappingURL=in-patients.controller.js.map