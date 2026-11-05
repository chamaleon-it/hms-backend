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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importStar(require("mongoose"));
const employee_schema_1 = require("./schemas/employee.schema");
let EmployeeService = class EmployeeService {
    employeeModel;
    constructor(employeeModel) {
        this.employeeModel = employeeModel;
    }
    async create(dto) {
        const employee = new this.employeeModel({
            ...dto,
            status: dto.status || 'Active',
            isDeleted: false,
        });
        return await employee.save();
    }
    async findAll(search, status, role) {
        const filter = { isDeleted: { $ne: true } };
        if (role && role !== 'all') {
            filter.role = { $regex: new RegExp(`^${role}$`, 'i') };
        }
        if (status && status !== 'all') {
            filter.status = { $regex: new RegExp(`^${status}$`, 'i') };
        }
        if (search && search.trim() !== '') {
            const searchRegex = { $regex: search.trim(), $options: 'i' };
            filter.$or = [
                { name: searchRegex },
                { phone: searchRegex },
                { email: searchRegex },
                { employeeId: searchRegex },
                { qualification: searchRegex },
                { designation: searchRegex },
                { specialization: searchRegex },
                { licenseNumber: searchRegex },
            ];
        }
        return await this.employeeModel
            .find(filter)
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }
    async findOne(id) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException(`Invalid employee ID: ${id}`);
        }
        const employee = await this.employeeModel
            .findOne({ _id: id, isDeleted: { $ne: true } })
            .lean()
            .exec();
        if (!employee) {
            throw new common_1.NotFoundException(`Employee with id ${id} not found`);
        }
        return employee;
    }
    async update(id, dto) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException(`Invalid employee ID: ${id}`);
        }
        const updated = await this.employeeModel
            .findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, { $set: dto }, { new: true })
            .lean()
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException(`Employee with id ${id} not found`);
        }
        return updated;
    }
    async softDelete(id) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException(`Invalid employee ID: ${id}`);
        }
        const deleted = await this.employeeModel
            .findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, { $set: { isDeleted: true } }, { new: true })
            .lean()
            .exec();
        if (!deleted) {
            throw new common_1.NotFoundException(`Employee with id ${id} not found`);
        }
        return deleted;
    }
    async updateInCharge(id) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException(`Invalid employee ID: ${id}`);
        }
        const employee = await this.employeeModel
            .findOne({ _id: id, isDeleted: { $ne: true } })
            .lean()
            .exec();
        if (!employee) {
            throw new common_1.NotFoundException(`Employee with id ${id} not found`);
        }
        await this.employeeModel.updateMany({ role: employee.role, inCharge: true }, { inCharge: false });
        const updated = await this.employeeModel
            .findByIdAndUpdate(id, { inCharge: true }, { new: true })
            .lean()
            .exec();
        return updated;
    }
};
exports.EmployeeService = EmployeeService;
exports.EmployeeService = EmployeeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(employee_schema_1.Employee.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], EmployeeService);
//# sourceMappingURL=employee.service.js.map