import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Technician } from './schemas/technician.schema';
import { RegisterTechnicianDto } from './dto/register-technician.dto';

@Injectable()
export class TechnicianService {
  constructor(
    @InjectModel(Technician.name)
    private readonly technicianModel: Model<Technician>,
  ) {}

  async registerTechnician(registerTechnicianDto: RegisterTechnicianDto) {
    const technician = new this.technicianModel(registerTechnicianDto);
    return technician.save();
  }

  async getAllTechnicians() {
    return await this.technicianModel.find({ isDeleted: false }).lean();
  }

  async deleteTechnician(id: string) {
    return await this.technicianModel
      .findByIdAndUpdate(id, { isDeleted: true })
      .lean();
  }

  async updateTechnician(
    id: string,
    updateTechnicianDto: RegisterTechnicianDto,
  ) {
    return await this.technicianModel
      .findByIdAndUpdate(id, updateTechnicianDto, { new: true })
      .lean();
  }

  async updateInCharge(id: string) {
    await this.technicianModel.updateMany(
      { inCharge: true },
      { inCharge: false },
    );
    return await this.technicianModel
      .findByIdAndUpdate(id, { inCharge: true }, { new: true })
      .lean();
  }
}
