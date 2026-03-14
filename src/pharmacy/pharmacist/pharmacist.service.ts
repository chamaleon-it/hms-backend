import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pharmacist } from './schemas/pharmacist.schema';
import { RegisterPharmacistDto } from './dto/register-pharmacist.dto';

@Injectable()
export class PharmacistService {
  constructor(
    @InjectModel(Pharmacist.name)
    private readonly pharmacistModel: Model<Pharmacist>,
  ) {}

  async registerPharmacist(registerPharmacistDto: RegisterPharmacistDto) {
    const pharmacist = new this.pharmacistModel(registerPharmacistDto);
    return pharmacist.save();
  }

  async getAllPharmacists() {
    return await this.pharmacistModel.find({ isDeleted: false }).lean();
  }

  async deletePharmacist(id: string) {
    return await this.pharmacistModel
      .findByIdAndUpdate(id, { isDeleted: true })
      .lean();
  }

  async updatePharmacist(
    id: string,
    updatePharmacistDto: RegisterPharmacistDto,
  ) {
    return await this.pharmacistModel
      .findByIdAndUpdate(id, updatePharmacistDto, { new: true })
      .lean();
  }

  async updateInCharge(id: string) {
    await this.pharmacistModel.updateMany(
      { inCharge: true },
      { inCharge: false },
    );
    return await this.pharmacistModel
      .findByIdAndUpdate(id, { inCharge: true }, { new: true })
      .lean();
  }
}
