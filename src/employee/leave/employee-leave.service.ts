import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  EmployeeLeave,
  EmployeeLeaveDocument,
  LeaveStatus,
  LeaveType,
} from './schemas/employee-leave.schema';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto, UpdateLeaveStatusDto } from './dto/update-leave.dto';
import { Employee, EmployeeDocument } from '../schemas/employee.schema';
import {
  EmployeeSalary,
  EmployeeSalaryDocument,
  SalaryPaymentStatus,
} from '../salary/schemas/employee-salary.schema';

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

@Injectable()
export class EmployeeLeaveService {
  constructor(
    @InjectModel(EmployeeLeave.name)
    private readonly leaveModel: Model<EmployeeLeaveDocument>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(EmployeeSalary.name)
    private readonly salaryModel: Model<EmployeeSalaryDocument>,
  ) {}

  private async syncPendingSalariesForEmployee(
    employee: any,
    dates: (Date | string)[],
  ) {
    try {
      const empId = employee?._id ? employee._id : employee;
      if (!empId) return;
      const empObjectId = new mongoose.Types.ObjectId(empId.toString());
      const affectedPeriods = new Map<string, { month: string; year: number }>();

      for (const rawD of dates) {
        const d = rawD ? new Date(rawD) : null;
        if (!d || isNaN(d.getTime())) continue;
        const month = MONTH_NAMES[d.getMonth()];
        const year = d.getFullYear();
        const key = `${month}-${year}`;
        if (!affectedPeriods.has(key)) {
          affectedPeriods.set(key, { month, year });
        }
      }

      for (const { month, year } of affectedPeriods.values()) {
        const monthIdx = MONTH_NAMES.findIndex(
          (m) => m.toLowerCase() === month.toLowerCase(),
        );
        const targetMonth = monthIdx >= 0 ? monthIdx : 0;
        const startDate = new Date(year, targetMonth, 1, 0, 0, 0, 0);
        const endDate = new Date(year, targetMonth + 1, 0, 23, 59, 59, 999);

        // Find all approved unpaid leaves for this employee in this month
        const approvedUnpaidLeaves = await this.leaveModel
          .find({
            employee: empObjectId,
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

        const totalUnpaidDays = approvedUnpaidLeaves.reduce(
          (sum, l) => sum + (Number(l.daysCount) || 0),
          0,
        );

        // Find pending salary slip for this period
        const pendingSalary = await this.salaryModel.findOne({
          employee: empObjectId,
          month,
          year,
          paymentStatus: SalaryPaymentStatus.PENDING,
          isDeleted: false,
        });

        if (pendingSalary) {
          const basicPay = Number(pendingSalary.basicPay) || 0;
          const unpaidLeaveDeduction =
            totalUnpaidDays * (basicPay > 0 ? basicPay / 30 : 0);
          const totalDeductions =
            (Number(pendingSalary.deductions) || 0) + unpaidLeaveDeduction;
          const grossSalary = Number(pendingSalary.grossSalary) || 0;
          const netSalary = Math.max(0, grossSalary - totalDeductions);

          pendingSalary.unpaidLeaves = totalUnpaidDays;
          pendingSalary.unpaidLeaveDeduction = unpaidLeaveDeduction;
          pendingSalary.netSalary = netSalary;
          await pendingSalary.save();
        }
      }
    } catch (err) {
      console.error('Error syncing pending salary for employee leave:', err);
    }
  }

  async create(createLeaveDto: CreateLeaveDto): Promise<EmployeeLeave> {
    const employeeExists = await this.employeeModel.findById(
      createLeaveDto.employee,
    );
    if (!employeeExists || employeeExists.isDeleted) {
      throw new NotFoundException('Employee not found');
    }

    const startDate = new Date(createLeaveDto.startDate);
    const endDate = new Date(createLeaveDto.endDate);

    const leave = new this.leaveModel({
      ...createLeaveDto,
      employee: new mongoose.Types.ObjectId(createLeaveDto.employee),
      startDate,
      endDate,
    });

    const saved = await leave.save();

    if (saved.status === LeaveStatus.APPROVED && saved.leaveType === LeaveType.UNPAID) {
      await this.syncPendingSalariesForEmployee(saved.employee, [
        startDate,
        endDate,
      ]);
    }

    return this.findOne(saved._id.toString());
  }

  async findAll(
    search?: string,
    status?: string,
    employeeId?: string,
    role?: string,
    month?: number,
    year?: number,
  ): Promise<EmployeeLeave[]> {
    const query: any = { isDeleted: false };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (employeeId && employeeId !== 'all') {
      query.employee = new mongoose.Types.ObjectId(employeeId);
    }

    if (year) {
      const targetYear = Number(year);
      let startDate: Date;
      let endDate: Date;

      if (month) {
        const targetMonth = Number(month) - 1; // 0-indexed
        startDate = new Date(targetYear, targetMonth, 1);
        endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
      } else {
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

    // Filter by employee search or role in populated documents
    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      leaves = leaves.filter((l: any) => {
        const empName = (l.employee?.name || '').toLowerCase();
        const empCode = (l.employee?.employeeId || '').toLowerCase();
        const reason = (l.reason || '').toLowerCase();
        const type = (l.leaveType || '').toLowerCase();
        return (
          empName.includes(term) ||
          empCode.includes(term) ||
          reason.includes(term) ||
          type.includes(term)
        );
      });
    }

    if (role && role !== 'all') {
      leaves = leaves.filter((l: any) => l.employee?.role === role);
    }

    return leaves;
  }

  async findOne(id: string): Promise<EmployeeLeave> {
    const leave = await this.leaveModel
      .findOne({ _id: id, isDeleted: false })
      .populate('employee', 'name role employeeId phone email designation inCharge')
      .lean()
      .exec();

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }
    return leave;
  }

  async getStats(year?: number, month?: number) {
    const query: any = { isDeleted: false };
    if (year) {
      const targetYear = Number(year);
      let startDate: Date;
      let endDate: Date;

      if (month) {
        const targetMonth = Number(month) - 1;
        startDate = new Date(targetYear, targetMonth, 1);
        endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
      } else {
        startDate = new Date(targetYear, 0, 1);
        endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
      }
      query.startDate = { $gte: startDate, $lte: endDate };
    }

    const allLeaves = await this.leaveModel.find(query).lean().exec();

    const total = allLeaves.length;
    const pending = allLeaves.filter((l) => l.status === LeaveStatus.PENDING).length;
    const approved = allLeaves.filter((l) => l.status === LeaveStatus.APPROVED).length;
    const rejected = allLeaves.filter((l) => l.status === LeaveStatus.REJECTED).length;
    const totalDaysApproved = allLeaves
      .filter((l) => l.status === LeaveStatus.APPROVED)
      .reduce((sum, l) => sum + (Number(l.daysCount) || 0), 0);

    return {
      total,
      pending,
      approved,
      rejected,
      totalDaysApproved,
    };
  }

  async update(id: string, updateLeaveDto: UpdateLeaveDto): Promise<EmployeeLeave> {
    const existing = await this.leaveModel.findById(id);
    if (!existing || existing.isDeleted) {
      throw new NotFoundException('Leave request not found');
    }

    const updatePayload: any = { ...updateLeaveDto };
    if (updateLeaveDto.employee) {
      updatePayload.employee = new mongoose.Types.ObjectId(updateLeaveDto.employee);
    }
    if (updateLeaveDto.startDate) {
      updatePayload.startDate = new Date(updateLeaveDto.startDate);
    }
    if (updateLeaveDto.endDate) {
      updatePayload.endDate = new Date(updateLeaveDto.endDate);
    }

    const updated = await this.leaveModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updatePayload,
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Leave request not found');
    }

    await this.syncPendingSalariesForEmployee(updated.employee, [
      existing.startDate,
      existing.endDate,
      updated.startDate,
      updated.endDate,
    ]);

    return this.findOne(id);
  }

  async updateStatus(
    id: string,
    dto: UpdateLeaveStatusDto,
  ): Promise<EmployeeLeave> {
    const existing = await this.leaveModel.findById(id);
    if (!existing || existing.isDeleted) {
      throw new NotFoundException('Leave request not found');
    }

    const updated = await this.leaveModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        status: dto.status,
        approvalNote: dto.approvalNote || '',
        approvedBy: dto.approvedBy || '',
      },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Leave request not found');
    }

    // Automatically sync pending salaries when leave status changes
    await this.syncPendingSalariesForEmployee(updated.employee, [
      updated.startDate,
      updated.endDate,
    ]);

    return this.findOne(id);
  }

  async softDelete(id: string): Promise<EmployeeLeave> {
    const existing = await this.leaveModel.findById(id);
    if (!existing || existing.isDeleted) {
      throw new NotFoundException('Leave request not found');
    }

    const deleted = await this.leaveModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true },
    );
    if (!deleted) {
      throw new NotFoundException('Leave request not found');
    }

    await this.syncPendingSalariesForEmployee(existing.employee, [
      existing.startDate,
      existing.endDate,
    ]);

    return deleted;
  }
}
