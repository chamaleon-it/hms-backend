import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Therapy } from './schemas/therapy.schema';
import { CreateTherapyDto } from './dto/create-therapy.dto';
import { UpdateTherapyDto } from './dto/update-therapy.dto';

@Injectable()
export class TherapyService {
  constructor(
    @InjectModel(Therapy.name) private therapyModel: Model<Therapy>,
  ) {}

  async createTherapy(dto: CreateTherapyDto) {
    const therapy = new this.therapyModel(dto);
    return await therapy.save();
  }

  async findAll(search?: string) {
    const filter: any = { isDeleted: false };
    if (search && search.trim() !== '') {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { code: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    return await this.therapyModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const therapy = await this.therapyModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!therapy) {
      throw new NotFoundException(`Therapy with id ${id} not found`);
    }
    return therapy;
  }

  async updateTherapy(id: string, dto: UpdateTherapyDto) {
    const therapy = await this.therapyModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, dto, { new: true })
      .exec();
    if (!therapy) {
      throw new NotFoundException(`Therapy with id ${id} not found`);
    }
    return therapy;
  }

  async softDeleteTherapy(id: string) {
    const therapy = await this.therapyModel
      .findOneAndUpdate({ _id: id }, { isDeleted: true }, { new: true })
      .exec();
    if (!therapy) {
      throw new NotFoundException(`Therapy with id ${id} not found`);
    }
    return therapy;
  }
}
