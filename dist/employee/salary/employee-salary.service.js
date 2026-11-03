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
exports.EmployeeSalaryService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importStar(require("mongoose"));
const employee_salary_schema_1 = require("./schemas/employee-salary.schema");
const employee_schema_1 = require("../schemas/employee.schema");
const employee_leave_schema_1 = require("../leave/schemas/employee-leave.schema");
const accounts_service_1 = require("../../accounts/accounts.service");
const account_transaction_enum_1 = require("../../accounts/enums/account-transaction.enum");
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
function getMonthDateRange(month, year) {
    const monthIdx = MONTH_NAMES.findIndex((m) => m.toLowerCase() === (month || '').toLowerCase());
    const targetMonth = monthIdx >= 0 ? monthIdx : 0;
    const startDate = new Date(year, targetMonth, 1, 0, 0, 0, 0);
    const endDate = new Date(year, targetMonth + 1, 0, 23, 59, 59, 999);
    return { startDate, endDate, monthIdx: targetMonth };
}
let EmployeeSalaryService = class EmployeeSalaryService {
    salaryModel;
    employeeModel;
    leaveModel;
    accountsService;
    constructor(salaryModel, employeeModel, leaveModel, accountsService) {
        this.salaryModel = salaryModel;
        this.employeeModel = employeeModel;
        this.leaveModel = leaveModel;
        this.accountsService = accountsService;
    }
    async getApprovedUnpaidLeaveDays(employeeId, month, year) {
        const { startDate, endDate } = getMonthDateRange(month, year);
        const leaves = await this.leaveModel
            .find({
            employee: new mongoose_2.default.Types.ObjectId(employeeId),
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
        const totalDays = leaves.reduce((sum, l) => sum + (Number(l.daysCount) || 0), 0);
        return totalDays;
    }
    calculateSalary(payload) {
        const basicPay = Number(payload.basicPay) || 0;
        const hourlySalary = Number(payload.hourlySalary) || 0;
        const hoursWorked = Number(payload.hoursWorked) || 0;
        const hourlyPayTotal = hourlySalary * hoursWorked;
        const commission = Number(payload.commission) || 0;
        const commissionAmount = payload.commissionAmount !== undefined
            ? Number(payload.commissionAmount) || 0
            : commission;
        const allowances = Number(payload.allowances) || 0;
        const bonus = Number(payload.bonus) || 0;
        const grossSalary = basicPay + hourlyPayTotal + commissionAmount + allowances + bonus;
        const deductions = Number(payload.deductions) || 0;
        const unpaidLeaves = Number(payload.unpaidLeaves) || 0;
        const unpaidLeaveDeduction = payload.unpaidLeaveDeduction !== undefined
            ? Number(payload.unpaidLeaveDeduction) || 0
            : unpaidLeaves * (basicPay > 0 ? basicPay / 30 : 0);
        const totalDeductions = deductions + unpaidLeaveDeduction;
        const netSalary = Math.max(0, grossSalary - totalDeductions);
        return {
            basicPay,
            hourlySalary,
            hoursWorked,
            hourlyPayTotal,
            commission,
            commissionAmount,
            allowances,
            bonus,
            grossSalary,
            deductions,
            unpaidLeaves,
            unpaidLeaveDeduction,
            netSalary,
        };
    }
    async create(createSalaryDto) {
        const employee = await this.employeeModel.findById(createSalaryDto.employee);
        if (!employee || employee.isDeleted) {
            throw new common_1.NotFoundException('Employee not found');
        }
        const existing = await this.salaryModel.findOne({
            employee: new mongoose_2.default.Types.ObjectId(createSalaryDto.employee),
            month: createSalaryDto.month,
            year: createSalaryDto.year,
            isDeleted: false,
        });
        if (existing) {
            throw new common_1.BadRequestException(`Salary slip for ${employee.name} for ${createSalaryDto.month} ${createSalaryDto.year} already exists`);
        }
        const basicPay = createSalaryDto.basicPay !== undefined
            ? createSalaryDto.basicPay
            : employee.basicPay || 0;
        const hourlySalary = createSalaryDto.hourlySalary !== undefined
            ? createSalaryDto.hourlySalary
            : employee.hourlySalary || 0;
        const commission = createSalaryDto.commission !== undefined
            ? createSalaryDto.commission
            : employee.commission || 0;
        let unpaidLeaves = createSalaryDto.unpaidLeaves;
        if (unpaidLeaves === undefined) {
            unpaidLeaves = await this.getApprovedUnpaidLeaveDays(createSalaryDto.employee, createSalaryDto.month, createSalaryDto.year);
        }
        const calculated = this.calculateSalary({
            ...createSalaryDto,
            basicPay,
            hourlySalary,
            commission,
            unpaidLeaves,
        });
        const salary = new this.salaryModel({
            ...createSalaryDto,
            ...calculated,
            employee: new mongoose_2.default.Types.ObjectId(createSalaryDto.employee),
            paymentStatus: employee_salary_schema_1.SalaryPaymentStatus.PENDING,
            paidAmount: 0,
        });
        const saved = await salary.save();
        return this.findOne(saved._id.toString());
    }
    async generateBatch(dto) {
        const query = { isDeleted: false, status: 'Active' };
        if (dto.role && dto.role !== 'all') {
            query.role = dto.role;
        }
        const employees = await this.employeeModel.find(query).lean().exec();
        const createdSalaries = [];
        const skippedSalaries = [];
        for (const emp of employees) {
            const exists = await this.salaryModel.findOne({
                employee: emp._id,
                month: dto.month,
                year: dto.year,
                isDeleted: false,
            });
            if (exists) {
                skippedSalaries.push({
                    employee: emp.name,
                    reason: 'Already exists',
                });
                continue;
            }
            const unpaidLeaves = await this.getApprovedUnpaidLeaveDays(emp._id, dto.month, dto.year);
            const calculated = this.calculateSalary({
                basicPay: emp.basicPay || 0,
                hourlySalary: emp.hourlySalary || 0,
                commission: emp.commission || 0,
                hoursWorked: 0,
                allowances: 0,
                bonus: 0,
                deductions: 0,
                unpaidLeaves,
            });
            const newSalary = new this.salaryModel({
                employee: emp._id,
                month: dto.month,
                year: dto.year,
                ...calculated,
                paymentStatus: employee_salary_schema_1.SalaryPaymentStatus.PENDING,
                paidAmount: 0,
            });
            const saved = await newSalary.save();
            createdSalaries.push(saved);
        }
        return {
            message: `Generated payroll for ${createdSalaries.length} employees. (${skippedSalaries.length} skipped)`,
            createdCount: createdSalaries.length,
            skippedCount: skippedSalaries.length,
        };
    }
    async findAll(month, year, employeeId, role, paymentStatus, search) {
        const query = { isDeleted: false };
        if (month && month !== 'all') {
            query.month = month;
        }
        if (year) {
            query.year = Number(year);
        }
        if (employeeId && employeeId !== 'all') {
            query.employee = new mongoose_2.default.Types.ObjectId(employeeId);
        }
        if (paymentStatus && paymentStatus !== 'all') {
            query.paymentStatus = paymentStatus;
        }
        let list = await this.salaryModel
            .find(query)
            .populate('employee', 'name role employeeId phone email designation basicPay hourlySalary commission inCharge')
            .sort({ createdAt: -1 })
            .exec();
        for (const item of list) {
            if (item.paymentStatus === employee_salary_schema_1.SalaryPaymentStatus.PENDING &&
                item.employee &&
                item.employee._id) {
                try {
                    const approvedUnpaidDays = await this.getApprovedUnpaidLeaveDays(item.employee._id, item.month, item.year);
                    if (approvedUnpaidDays !== item.unpaidLeaves) {
                        const basicPay = Number(item.basicPay) || 0;
                        const unpaidLeaveDeduction = approvedUnpaidDays * (basicPay > 0 ? basicPay / 30 : 0);
                        const totalDeductions = (Number(item.deductions) || 0) + unpaidLeaveDeduction;
                        const grossSalary = Number(item.grossSalary) || 0;
                        const netSalary = Math.max(0, grossSalary - totalDeductions);
                        item.unpaidLeaves = approvedUnpaidDays;
                        item.unpaidLeaveDeduction = unpaidLeaveDeduction;
                        item.netSalary = netSalary;
                        await item.save();
                    }
                }
                catch (err) {
                    console.error('Error auto-syncing unpaid leaves for salary item:', err);
                }
            }
        }
        let plainList = list.map((doc) => doc.toObject());
        if (role && role !== 'all') {
            plainList = plainList.filter((s) => s.employee?.role === role);
        }
        if (search && search.trim()) {
            const term = search.toLowerCase().trim();
            plainList = plainList.filter((s) => {
                const empName = (s.employee?.name || '').toLowerCase();
                const empCode = (s.employee?.employeeId || '').toLowerCase();
                const ref = (s.transactionReference || '').toLowerCase();
                const note = (s.note || '').toLowerCase();
                return (empName.includes(term) ||
                    empCode.includes(term) ||
                    ref.includes(term) ||
                    note.includes(term));
            });
        }
        return plainList;
    }
    async findOne(id) {
        const salary = await this.salaryModel
            .findOne({ _id: id, isDeleted: false })
            .populate('employee', 'name role employeeId phone email designation qualification address licenseNumber inCharge basicPay hourlySalary commission')
            .lean()
            .exec();
        if (!salary) {
            throw new common_1.NotFoundException('Salary record not found');
        }
        return salary;
    }
    async getStats(month, year) {
        const query = { isDeleted: false };
        if (month && month !== 'all')
            query.month = month;
        if (year)
            query.year = Number(year);
        const salaries = await this.salaryModel.find(query).lean().exec();
        const totalCount = salaries.length;
        const totalPayroll = salaries.reduce((sum, s) => sum + (Number(s.netSalary) || 0), 0);
        const totalPaid = salaries.reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);
        const totalPending = Math.max(0, totalPayroll - totalPaid);
        const paidCount = salaries.filter((s) => s.paymentStatus === employee_salary_schema_1.SalaryPaymentStatus.PAID).length;
        const pendingCount = salaries.filter((s) => s.paymentStatus !== employee_salary_schema_1.SalaryPaymentStatus.PAID).length;
        return {
            totalCount,
            totalPayroll,
            totalPaid,
            totalPending,
            paidCount,
            pendingCount,
        };
    }
    async update(id, updateSalaryDto) {
        const existing = await this.salaryModel.findById(id);
        if (!existing || existing.isDeleted) {
            throw new common_1.NotFoundException('Salary record not found');
        }
        const basicPay = updateSalaryDto.basicPay !== undefined
            ? Number(updateSalaryDto.basicPay)
            : Number(existing.basicPay) || 0;
        const hourlySalary = updateSalaryDto.hourlySalary !== undefined
            ? Number(updateSalaryDto.hourlySalary)
            : Number(existing.hourlySalary) || 0;
        const hoursWorked = updateSalaryDto.hoursWorked !== undefined
            ? Number(updateSalaryDto.hoursWorked)
            : Number(existing.hoursWorked) || 0;
        const commission = updateSalaryDto.commission !== undefined
            ? Number(updateSalaryDto.commission)
            : Number(existing.commission) || 0;
        const commissionAmount = updateSalaryDto.commissionAmount !== undefined
            ? Number(updateSalaryDto.commissionAmount)
            : updateSalaryDto.commission !== undefined
                ? Number(updateSalaryDto.commission)
                : Number(existing.commissionAmount) || 0;
        const allowances = updateSalaryDto.allowances !== undefined
            ? Number(updateSalaryDto.allowances)
            : Number(existing.allowances) || 0;
        const bonus = updateSalaryDto.bonus !== undefined
            ? Number(updateSalaryDto.bonus)
            : Number(existing.bonus) || 0;
        const deductions = updateSalaryDto.deductions !== undefined
            ? Number(updateSalaryDto.deductions)
            : Number(existing.deductions) || 0;
        const unpaidLeaves = updateSalaryDto.unpaidLeaves !== undefined
            ? Number(updateSalaryDto.unpaidLeaves)
            : Number(existing.unpaidLeaves) || 0;
        const unpaidLeaveDeduction = updateSalaryDto.unpaidLeaveDeduction !== undefined
            ? Number(updateSalaryDto.unpaidLeaveDeduction)
            : unpaidLeaves * (basicPay > 0 ? basicPay / 30 : 0);
        const calculated = this.calculateSalary({
            basicPay,
            hourlySalary,
            hoursWorked,
            commission,
            commissionAmount,
            allowances,
            bonus,
            deductions,
            unpaidLeaves,
            unpaidLeaveDeduction,
        });
        const updated = await this.salaryModel.findOneAndUpdate({ _id: id, isDeleted: false }, {
            ...updateSalaryDto,
            ...calculated,
        }, { new: true });
        if (!updated) {
            throw new common_1.NotFoundException('Salary record not found');
        }
        return this.findOne(id);
    }
    async paySalary(id, paySalaryDto) {
        const existing = await this.salaryModel
            .findOne({ _id: id, isDeleted: false })
            .populate('employee', 'name role employeeId')
            .exec();
        if (!existing) {
            throw new common_1.NotFoundException('Salary record not found');
        }
        const amountToPay = paySalaryDto.amount !== undefined && paySalaryDto.amount > 0
            ? Number(paySalaryDto.amount)
            : existing.netSalary;
        const newPaidAmount = (existing.paidAmount || 0) + amountToPay;
        const isFullyPaid = newPaidAmount >= existing.netSalary - 0.01;
        existing.paidAmount = newPaidAmount;
        existing.paymentStatus = isFullyPaid
            ? employee_salary_schema_1.SalaryPaymentStatus.PAID
            : employee_salary_schema_1.SalaryPaymentStatus.PARTIALLY_PAID;
        existing.paymentMethod = paySalaryDto.paymentMethod;
        existing.paymentDate = paySalaryDto.paymentDate
            ? new Date(paySalaryDto.paymentDate)
            : new Date();
        if (paySalaryDto.transactionReference) {
            existing.transactionReference = paySalaryDto.transactionReference;
        }
        if (paySalaryDto.note) {
            existing.note = paySalaryDto.note;
        }
        await existing.save();
        try {
            let paymentMethod = account_transaction_enum_1.PaymentMethod.Cash;
            if (paySalaryDto.paymentMethod === employee_salary_schema_1.SalaryPaymentMethod.UPI) {
                paymentMethod = account_transaction_enum_1.PaymentMethod.UPI;
            }
            else if (paySalaryDto.paymentMethod === employee_salary_schema_1.SalaryPaymentMethod.BANK_TRANSFER ||
                paySalaryDto.paymentMethod === employee_salary_schema_1.SalaryPaymentMethod.CHEQUE) {
                paymentMethod = account_transaction_enum_1.PaymentMethod.Card;
            }
            await this.accountsService.recordTransaction({
                type: account_transaction_enum_1.TransactionType.Expense,
                category: account_transaction_enum_1.ExpenseCategory.Salary,
                amount: amountToPay,
                description: `Salary payout to ${existing.employee?.name || 'Employee'} for ${existing.month} ${existing.year} (${paySalaryDto.paymentMethod})`,
                paymentMethod,
                sourceModule: account_transaction_enum_1.SourceModule.Reception,
                transactionDate: existing.paymentDate,
            });
        }
        catch (err) {
            console.error('Error logging salary expense in accounts:', err);
        }
        return this.findOne(id);
    }
    async softDelete(id) {
        const deleted = await this.salaryModel.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true }, { new: true });
        if (!deleted) {
            throw new common_1.NotFoundException('Salary record not found');
        }
        return deleted;
    }
};
exports.EmployeeSalaryService = EmployeeSalaryService;
exports.EmployeeSalaryService = EmployeeSalaryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(employee_salary_schema_1.EmployeeSalary.name)),
    __param(1, (0, mongoose_1.InjectModel)(employee_schema_1.Employee.name)),
    __param(2, (0, mongoose_1.InjectModel)(employee_leave_schema_1.EmployeeLeave.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        accounts_service_1.AccountsService])
], EmployeeSalaryService);
//# sourceMappingURL=employee-salary.service.js.map