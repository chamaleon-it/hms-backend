import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  EmployeeSalary,
  EmployeeSalaryDocument,
  SalaryPaymentMethod,
  SalaryPaymentStatus,
} from './schemas/employee-salary.schema';
import {
  CreateSalaryDto,
  GenerateBatchPayrollDto,
} from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { PaySalaryDto } from './dto/pay-salary.dto';
import { Employee, EmployeeDocument } from '../schemas/employee.schema';
import {
  EmployeeLeave,
  EmployeeLeaveDocument,
  LeaveStatus,
  LeaveType,
} from '../leave/schemas/employee-leave.schema';
import { AccountsService } from '../../accounts/accounts.service';
import {
  ExpenseCategory,
  PaymentMethod,
  SourceModule,
  TransactionType,
} from '../../accounts/enums/account-transaction.enum';

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

function getMonthDateRange(month: string, year: number) {
  const monthIdx = MONTH_NAMES.findIndex(
    (m) => m.toLowerCase() === (month || '').toLowerCase(),
  );
  const targetMonth = monthIdx >= 0 ? monthIdx : 0;
  const startDate = new Date(year, targetMonth, 1, 0, 0, 0, 0);
  const endDate = new Date(year, targetMonth + 1, 0, 23, 59, 59, 999);
  return { startDate, endDate, monthIdx: targetMonth };
}

@Injectable()
export class EmployeeSalaryService {
  constructor(
    @InjectModel(EmployeeSalary.name)
    private readonly salaryModel: Model<EmployeeSalaryDocument>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(EmployeeLeave.name)
    private readonly leaveModel: Model<EmployeeLeaveDocument>,
    private readonly accountsService: AccountsService,
  ) {}

  public async getApprovedUnpaidLeaveDays(
    employeeId: string | mongoose.Types.ObjectId,
    month: string,
    year: number,
  ): Promise<number> {
    const { startDate, endDate } = getMonthDateRange(month, year);
    const leaves = await this.leaveModel
      .find({
        employee: new mongoose.Types.ObjectId(employeeId),
        leaveType: LeaveType.UNPAID,
        status: LeaveStatus.APPROVED,
        isDeleted: false,
        $or: [
          { startDate: { $gte: startDate, $lte: endDate } },
          { endDate: { $gte: startDate, $lte: endDate } },
          { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
        ],
      })
      .lean()
      .exec();

    const totalDays = leaves.reduce(
      (sum, l) => sum + (Number(l.daysCount) || 0),
      0,
    );
    return totalDays;
  }

  private calculateSalary(payload: any) {
    const basicPay = Number(payload.basicPay) || 0;
    const hourlySalary = Number(payload.hourlySalary) || 0;
    const hoursWorked = Number(payload.hoursWorked) || 0;
    const hourlyPayTotal = hourlySalary * hoursWorked;

    const commission = Number(payload.commission) || 0;
    const commissionAmount =
      payload.commissionAmount !== undefined
        ? Number(payload.commissionAmount) || 0
        : commission;

    const allowances = Number(payload.allowances) || 0;
    const bonus = Number(payload.bonus) || 0;

    const grossSalary =
      basicPay + hourlyPayTotal + commissionAmount + allowances + bonus;

    const deductions = Number(payload.deductions) || 0;
    const unpaidLeaves = Number(payload.unpaidLeaves) || 0;
    const unpaidLeaveDeduction =
      payload.unpaidLeaveDeduction !== undefined
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

  async create(createSalaryDto: CreateSalaryDto): Promise<EmployeeSalary> {
    const employee = await this.employeeModel.findById(createSalaryDto.employee);
    if (!employee || employee.isDeleted) {
      throw new NotFoundException('Employee not found');
    }

    const existing = await this.salaryModel.findOne({
      employee: new mongoose.Types.ObjectId(createSalaryDto.employee),
      month: createSalaryDto.month,
      year: createSalaryDto.year,
      isDeleted: false,
    });

    if (existing) {
      throw new BadRequestException(
        `Salary slip for ${employee.name} for ${createSalaryDto.month} ${createSalaryDto.year} already exists`,
      );
    }

    const basicPay =
      createSalaryDto.basicPay !== undefined
        ? createSalaryDto.basicPay
        : employee.basicPay || 0;
    const hourlySalary =
      createSalaryDto.hourlySalary !== undefined
        ? createSalaryDto.hourlySalary
        : employee.hourlySalary || 0;
    const commission =
      createSalaryDto.commission !== undefined
        ? createSalaryDto.commission
        : employee.commission || 0;

    // Automatically lookup approved unpaid leaves if not explicitly provided
    let unpaidLeaves = createSalaryDto.unpaidLeaves;
    if (unpaidLeaves === undefined) {
      unpaidLeaves = await this.getApprovedUnpaidLeaveDays(
        createSalaryDto.employee,
        createSalaryDto.month,
        createSalaryDto.year,
      );
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
      employee: new mongoose.Types.ObjectId(createSalaryDto.employee),
      paymentStatus: SalaryPaymentStatus.PENDING,
      paidAmount: 0,
    });

    const saved = await salary.save();
    return this.findOne(saved._id.toString());
  }

  async generateBatch(dto: GenerateBatchPayrollDto) {
    const query: any = { isDeleted: false, status: 'Active' };
    if (dto.role && dto.role !== 'all') {
      query.role = dto.role;
    }

    const employees = await this.employeeModel.find(query).lean().exec();
    const createdSalaries: any[] = [];
    const skippedSalaries: any[] = [];

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

      // Automatically query approved unpaid leaves for this month/year
      const unpaidLeaves = await this.getApprovedUnpaidLeaveDays(
        emp._id,
        dto.month,
        dto.year,
      );

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
        paymentStatus: SalaryPaymentStatus.PENDING,
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

  async findAll(
    month?: string,
    year?: number,
    employeeId?: string,
    role?: string,
    paymentStatus?: string,
    search?: string,
  ): Promise<EmployeeSalary[]> {
    const query: any = { isDeleted: false };

    if (month && month !== 'all') {
      query.month = month;
    }

    if (year) {
      query.year = Number(year);
    }

    if (employeeId && employeeId !== 'all') {
      query.employee = new mongoose.Types.ObjectId(employeeId);
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }

    let list = await this.salaryModel
      .find(query)
      .populate(
        'employee',
        'name role employeeId phone email designation basicPay hourlySalary commission inCharge',
      )
      .sort({ createdAt: -1 })
      .exec();

    // Auto-sync pending salary slips with approved unpaid leaves
    for (const item of list) {
      if (
        item.paymentStatus === SalaryPaymentStatus.PENDING &&
        item.employee &&
        (item.employee as any)._id
      ) {
        try {
          const approvedUnpaidDays = await this.getApprovedUnpaidLeaveDays(
            (item.employee as any)._id,
            item.month,
            item.year,
          );

          if (approvedUnpaidDays !== item.unpaidLeaves) {
            const basicPay = Number(item.basicPay) || 0;
            const unpaidLeaveDeduction =
              approvedUnpaidDays * (basicPay > 0 ? basicPay / 30 : 0);
            const totalDeductions =
              (Number(item.deductions) || 0) + unpaidLeaveDeduction;
            const grossSalary = Number(item.grossSalary) || 0;
            const netSalary = Math.max(0, grossSalary - totalDeductions);

            item.unpaidLeaves = approvedUnpaidDays;
            item.unpaidLeaveDeduction = unpaidLeaveDeduction;
            item.netSalary = netSalary;
            await item.save();
          }
        } catch (err) {
          console.error('Error auto-syncing unpaid leaves for salary item:', err);
        }
      }
    }

    let plainList = list.map((doc) => doc.toObject());

    if (role && role !== 'all') {
      plainList = plainList.filter((s: any) => s.employee?.role === role);
    }

    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      plainList = plainList.filter((s: any) => {
        const empName = (s.employee?.name || '').toLowerCase();
        const empCode = (s.employee?.employeeId || '').toLowerCase();
        const ref = (s.transactionReference || '').toLowerCase();
        const note = (s.note || '').toLowerCase();
        return (
          empName.includes(term) ||
          empCode.includes(term) ||
          ref.includes(term) ||
          note.includes(term)
        );
      });
    }

    return plainList as EmployeeSalary[];
  }

  async findOne(id: string): Promise<EmployeeSalary> {
    const salary = await this.salaryModel
      .findOne({ _id: id, isDeleted: false })
      .populate(
        'employee',
        'name role employeeId phone email designation qualification address licenseNumber inCharge basicPay hourlySalary commission',
      )
      .lean()
      .exec();

    if (!salary) {
      throw new NotFoundException('Salary record not found');
    }
    return salary;
  }

  async getStats(month?: string, year?: number) {
    const query: any = { isDeleted: false };
    if (month && month !== 'all') query.month = month;
    if (year) query.year = Number(year);

    const salaries = await this.salaryModel.find(query).lean().exec();

    const totalCount = salaries.length;
    const totalPayroll = salaries.reduce(
      (sum, s) => sum + (Number(s.netSalary) || 0),
      0,
    );
    const totalPaid = salaries.reduce(
      (sum, s) => sum + (Number(s.paidAmount) || 0),
      0,
    );
    const totalPending = Math.max(0, totalPayroll - totalPaid);
    const paidCount = salaries.filter(
      (s) => s.paymentStatus === SalaryPaymentStatus.PAID,
    ).length;
    const pendingCount = salaries.filter(
      (s) => s.paymentStatus !== SalaryPaymentStatus.PAID,
    ).length;

    return {
      totalCount,
      totalPayroll,
      totalPaid,
      totalPending,
      paidCount,
      pendingCount,
    };
  }

  async update(id: string, updateSalaryDto: UpdateSalaryDto): Promise<EmployeeSalary> {
    const existing = await this.salaryModel.findById(id);
    if (!existing || existing.isDeleted) {
      throw new NotFoundException('Salary record not found');
    }

    const basicPay =
      updateSalaryDto.basicPay !== undefined
        ? Number(updateSalaryDto.basicPay)
        : Number(existing.basicPay) || 0;
    const hourlySalary =
      updateSalaryDto.hourlySalary !== undefined
        ? Number(updateSalaryDto.hourlySalary)
        : Number(existing.hourlySalary) || 0;
    const hoursWorked =
      updateSalaryDto.hoursWorked !== undefined
        ? Number(updateSalaryDto.hoursWorked)
        : Number(existing.hoursWorked) || 0;
    const commission =
      updateSalaryDto.commission !== undefined
        ? Number(updateSalaryDto.commission)
        : Number(existing.commission) || 0;
    const commissionAmount =
      updateSalaryDto.commissionAmount !== undefined
        ? Number(updateSalaryDto.commissionAmount)
        : updateSalaryDto.commission !== undefined
        ? Number(updateSalaryDto.commission)
        : Number(existing.commissionAmount) || 0;
    const allowances =
      updateSalaryDto.allowances !== undefined
        ? Number(updateSalaryDto.allowances)
        : Number(existing.allowances) || 0;
    const bonus =
      updateSalaryDto.bonus !== undefined
        ? Number(updateSalaryDto.bonus)
        : Number(existing.bonus) || 0;
    const deductions =
      updateSalaryDto.deductions !== undefined
        ? Number(updateSalaryDto.deductions)
        : Number(existing.deductions) || 0;
    const unpaidLeaves =
      updateSalaryDto.unpaidLeaves !== undefined
        ? Number(updateSalaryDto.unpaidLeaves)
        : Number(existing.unpaidLeaves) || 0;

    const unpaidLeaveDeduction =
      updateSalaryDto.unpaidLeaveDeduction !== undefined
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

    const updated = await this.salaryModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        ...updateSalaryDto,
        ...calculated,
      },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Salary record not found');
    }
    return this.findOne(id);
  }

  async paySalary(id: string, paySalaryDto: PaySalaryDto): Promise<EmployeeSalary> {
    const existing = await this.salaryModel
      .findOne({ _id: id, isDeleted: false })
      .populate('employee', 'name role employeeId')
      .exec();

    if (!existing) {
      throw new NotFoundException('Salary record not found');
    }

    const amountToPay =
      paySalaryDto.amount !== undefined && paySalaryDto.amount > 0
        ? Number(paySalaryDto.amount)
        : existing.netSalary;

    const newPaidAmount = (existing.paidAmount || 0) + amountToPay;
    const isFullyPaid = newPaidAmount >= existing.netSalary - 0.01;

    existing.paidAmount = newPaidAmount;
    existing.paymentStatus = isFullyPaid
      ? SalaryPaymentStatus.PAID
      : SalaryPaymentStatus.PARTIALLY_PAID;
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
      let paymentMethod = PaymentMethod.Cash;
      if (paySalaryDto.paymentMethod === SalaryPaymentMethod.UPI) {
        paymentMethod = PaymentMethod.UPI;
      } else if (
        paySalaryDto.paymentMethod === SalaryPaymentMethod.BANK_TRANSFER ||
        paySalaryDto.paymentMethod === SalaryPaymentMethod.CHEQUE
      ) {
        paymentMethod = PaymentMethod.Card;
      }

      await this.accountsService.recordTransaction({
        type: TransactionType.Expense,
        category: ExpenseCategory.Salary,
        amount: amountToPay,
        description: `Salary payout to ${(existing.employee as any)?.name || 'Employee'} for ${existing.month} ${existing.year} (${paySalaryDto.paymentMethod})`,
        paymentMethod,
        sourceModule: SourceModule.Reception,
        transactionDate: existing.paymentDate,
      });
    } catch (err) {
      console.error('Error logging salary expense in accounts:', err);
    }

    return this.findOne(id);
  }

  async softDelete(id: string): Promise<EmployeeSalary> {
    const deleted = await this.salaryModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true },
    );
    if (!deleted) {
      throw new NotFoundException('Salary record not found');
    }
    return deleted;
  }
}
