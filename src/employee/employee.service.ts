import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Employee, EmployeeDocument } from './schemas/employee.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel(Employee.name)
    private employeeModel: Model<EmployeeDocument>,
  ) {}

  // ── Unified CRUD ───────────────────────────────────────────────────────

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    const employee = new this.employeeModel({
      ...dto,
      status: dto.status || 'Active',
      isDeleted: false,
    });
    return await employee.save();
  }

  async findAll(
    search?: string,
    status?: string,
    role?: string,
  ): Promise<Employee[]> {
    const filter: any = { isDeleted: { $ne: true } };

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

  async findOne(id: string): Promise<Employee> {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid employee ID: ${id}`);
    }

    const employee = await this.employeeModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .lean()
      .exec();

    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }

    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid employee ID: ${id}`);
    }

    const updated = await this.employeeModel
      .findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
        { $set: dto },
        { new: true },
      )
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }

    return updated;
  }

  async softDelete(id: string): Promise<Employee> {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid employee ID: ${id}`);
    }

    const deleted = await this.employeeModel
      .findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
        { $set: { isDeleted: true } },
        { new: true },
      )
      .lean()
      .exec();

    if (!deleted) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }

    return deleted;
  }


  async updateInCharge(id: string): Promise<Employee> {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid employee ID: ${id}`);
    }

    // Find the employee first to know its role
    const employee = await this.employeeModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .lean()
      .exec();

    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }

    // Clear inCharge for all employees of the same role
    await this.employeeModel.updateMany(
      { role: employee.role, inCharge: true },
      { inCharge: false },
    );

    // Set this one as inCharge
    const updated = await this.employeeModel
      .findByIdAndUpdate(id, { inCharge: true }, { new: true , runValidators: true })
      .lean()
      .exec();

    return updated!;
  }
}
