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
exports.EmployeeLeaveService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importStar(require("mongoose"));
const employee_leave_schema_1 = require("./schemas/employee-leave.schema");
const employee_schema_1 = require("../schemas/employee.schema");
const employee_salary_schema_1 = require("../salary/schemas/employee-salary.schema");
const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];
let EmployeeLeaveService = class EmployeeLeaveService {
    leaveModel;
    employeeModel;
    salaryModel;
    constructor(leaveModel, employeeModel, salaryModel) {
        this.leaveModel = leaveModel;
        this.employeeModel = employeeModel;
        this.salaryModel = salaryModel;
    }
    async syncPendingSalariesForEmployee(employee, dates) {
        try {
            const empId = employee?._id ? employee._id : employee;
            if (!empId)
                return;
            const empObjectId = new mongoose_2.default.Types.ObjectId(empId.toString());
            const affectedPeriods = new Map();
            for (const rawD of dates) {
                const d = rawD ? new Date(rawD) : null;
                if (!d || isNaN(d.getTime()))
                    continue;
                const month = MONTH_NAMES[d.getMonth()];
                const year = d.getFullYear();
                const key = `${month}-${year}`;
                if (!affectedPeriods.has(key)) {
                    affectedPeriods.set(key, { month, year });
                }
            }
            for (const { month, year } of affectedPeriods.values()) {
                const monthIdx = MONTH_NAMES.findIndex((m) => m.toLowerCase() === month.toLowerCase());
                const targetMonth = monthIdx >= 0 ? monthIdx : 0;
                const startDate = new Date(year, targetMonth, 1, 0, 0, 0, 0);
                const endDate = new Date(year, targetMonth + 1, 0, 23, 59, 59, 999);
                const approvedUnpaidLeaves = await this.leaveModel
                    .find({
                    employee: empObjectId,
                    leaveType: employee_leave_schema_1.LeaveType.UNPAID,
                    status: employee_leave_schema_1.LeaveStatus.APPROVED,
                    isDeleted: false,
                    $or: [
                        { startDate: { $gte: startDate, $lte: endDate } },
                        { endDate: { $gte: startDate, $lte: endDate } },
                        { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
                    ],
                })
                    .lean()
                    .exec();
                const totalUnpaidDays = approvedUnpaidLeaves.reduce((sum, l) => sum + (Number(l.daysCount) || 0), 0);
                const pendingSalary = await this.salaryModel.findOne({
                    employee: empObjectId,
                    month,
                    year,
                    paymentStatus: employee_salary_schema_1.SalaryPaymentStatus.PENDING,
                    isDeleted: false,
                });
                if (pendingSalary) {
                    const basicPay = Number(pendingSalary.basicPay) || 0;
                    const unpaidLeaveDeduction = totalUnpaidDays * (basicPay > 0 ? basicPay / 30 : 0);
                    const totalDeductions = (Number(pendingSalary.deductions) || 0) + unpaidLeaveDeduction;
                    const grossSalary = Number(pendingSalary.grossSalary) || 0;
                    const netSalary = Math.max(0, grossSalary - totalDeductions);
                    pendingSalary.unpaidLeaves = totalUnpaidDays;
                    pendingSalary.unpaidLeaveDeduction = unpaidLeaveDeduction;
                    pendingSalary.netSalary = netSalary;
                    await pendingSalary.save();
                }
            }
        }
        catch (err) {
            console.error('Error syncing pending salary for employee leave:', err);
        }
    }
    async create(createLeaveDto) {
        const employeeExists = await this.employeeModel.findById(createLeaveDto.employee);
        if (!employeeExists || employeeExists.isDeleted) {
            throw new common_1.NotFoundException('Employee not found');
        }
        const startDate = new Date(createLeaveDto.startDate);
        const endDate = new Date(createLeaveDto.endDate);
        const leave = new this.leaveModel({
            ...createLeaveDto,
            employee: new mongoose_2.default.Types.ObjectId(createLeaveDto.employee),
            startDate,
            endDate,
        });
        const saved = await leave.save();
        if (saved.status === employee_leave_schema_1.LeaveStatus.APPROVED && saved.leaveType === employee_leave_schema_1.LeaveType.UNPAID) {
            await this.syncPendingSalariesForEmployee(saved.employee, [
                startDate,
                endDate,
            ]);
        }
        return this.findOne(saved._id.toString());
    }
    async findAll(search, status, employeeId, role, month, year) {
        const query = { isDeleted: false };
        if (status && status !== 'all') {
            query.status = status;
        }
        if (employeeId && employeeId !== 'all') {
            query.employee = new mongoose_2.default.Types.ObjectId(employeeId);
        }
        if (year) {
            const targetYear = Number(year);
            let startDate;
            let endDate;
            if (month) {
                const targetMonth = Number(month) - 1;
                startDate = new Date(targetYear, targetMonth, 1);
                endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
            }
            else {
                startDate = new Date(targetYear, 0, 1);
                endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
            }
            query.startDate = { $gte: startDate, $lte: endDate };
        }
        let leaves = await this.leaveModel
            .find(query)
            .populate('employee', 'name role employeeId phone email designation inCharge')
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        if (search && search.trim()) {
            const term = search.toLowerCase().trim();
            leaves = leaves.filter((l) => {
                const empName = (l.employee?.name || '').toLowerCase();
                const empCode = (l.employee?.employeeId || '').toLowerCase();
                const reason = (l.reason || '').toLowerCase();
                const type = (l.leaveType || '').toLowerCase();
                return (empName.includes(term) ||
                    empCode.includes(term) ||
                    reason.includes(term) ||
                    type.includes(term));
            });
        }
        if (role && role !== 'all') {
            leaves = leaves.filter((l) => l.employee?.role === role);
        }
        return leaves;
    }
    async findOne(id) {
        const leave = await this.leaveModel
            .findOne({ _id: id, isDeleted: false })
            .populate('employee', 'name role employeeId phone email designation inCharge')
            .lean()
            .exec();
        if (!leave) {
            throw new common_1.NotFoundException('Leave request not found');
        }
        return leave;
    }
    async getStats(year, month) {
        const query = { isDeleted: false };
        if (year) {
            const targetYear = Number(year);
            let startDate;
            let endDate;
            if (month) {
                const targetMonth = Number(month) - 1;
                startDate = new Date(targetYear, targetMonth, 1);
                endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
            }
            else {
                startDate = new Date(targetYear, 0, 1);
                endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
            }
            query.startDate = { $gte: startDate, $lte: endDate };
        }
        const allLeaves = await this.leaveModel.find(query).lean().exec();
        const total = allLeaves.length;
        const pending = allLeaves.filter((l) => l.status === employee_leave_schema_1.LeaveStatus.PENDING).length;
        const approved = allLeaves.filter((l) => l.status === employee_leave_schema_1.LeaveStatus.APPROVED).length;
        const rejected = allLeaves.filter((l) => l.status === employee_leave_schema_1.LeaveStatus.REJECTED).length;
        const totalDaysApproved = allLeaves
            .filter((l) => l.status === employee_leave_schema_1.LeaveStatus.APPROVED)
            .reduce((sum, l) => sum + (Number(l.daysCount) || 0), 0);
        return {
            total,
            pending,
            approved,
            rejected,
            totalDaysApproved,
        };
    }
    async update(id, updateLeaveDto) {
        const existing = await this.leaveModel.findById(id);
        if (!existing || existing.isDeleted) {
            throw new common_1.NotFoundException('Leave request not found');
        }
        const updatePayload = { ...updateLeaveDto };
        if (updateLeaveDto.employee) {
            updatePayload.employee = new mongoose_2.default.Types.ObjectId(updateLeaveDto.employee);
        }
        if (updateLeaveDto.startDate) {
            updatePayload.startDate = new Date(updateLeaveDto.startDate);
        }
        if (updateLeaveDto.endDate) {
            updatePayload.endDate = new Date(updateLeaveDto.endDate);
        }
        const updated = await this.leaveModel.findOneAndUpdate({ _id: id, isDeleted: false }, updatePayload, { new: true });
        if (!updated) {
            throw new common_1.NotFoundException('Leave request not found');
        }
        await this.syncPendingSalariesForEmployee(updated.employee, [
            existing.startDate,
            existing.endDate,
            updated.startDate,
            updated.endDate,
        ]);
        return this.findOne(id);
    }
    async updateStatus(id, dto) {
        const existing = await this.leaveModel.findById(id);
        if (!existing || existing.isDeleted) {
            throw new common_1.NotFoundException('Leave request not found');
        }
        const updated = await this.leaveModel.findOneAndUpdate({ _id: id, isDeleted: false }, {
            status: dto.status,
            approvalNote: dto.approvalNote || '',
            approvedBy: dto.approvedBy || '',
        }, { new: true });
        if (!updated) {
            throw new common_1.NotFoundException('Leave request not found');
        }
        await this.syncPendingSalariesForEmployee(updated.employee, [
            updated.startDate,
            updated.endDate,
        ]);
        return this.findOne(id);
    }
    async softDelete(id) {
        const existing = await this.leaveModel.findById(id);
        if (!existing || existing.isDeleted) {
            throw new common_1.NotFoundException('Leave request not found');
        }
        const deleted = await this.leaveModel.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true }, { new: true });
        if (!deleted) {
            throw new common_1.NotFoundException('Leave request not found');
        }
        await this.syncPendingSalariesForEmployee(existing.employee, [
            existing.startDate,
            existing.endDate,
        ]);
        return deleted;
    }
};
exports.EmployeeLeaveService = EmployeeLeaveService;
exports.EmployeeLeaveService = EmployeeLeaveService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(employee_leave_schema_1.EmployeeLeave.name)),
    __param(1, (0, mongoose_1.InjectModel)(employee_schema_1.Employee.name)),
    __param(2, (0, mongoose_1.InjectModel)(employee_salary_schema_1.EmployeeSalary.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], EmployeeLeaveService);
//# sourceMappingURL=employee-leave.service.js.map