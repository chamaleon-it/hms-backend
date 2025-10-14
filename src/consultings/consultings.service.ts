import { BadRequestException, Injectable } from '@nestjs/common';
import { ConsultingDto } from './dto/consulting.dto';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Consulting } from './schemas/consulting.schema';

@Injectable()
export class ConsultingsService {
  constructor(
    @InjectModel(Consulting.name) private consultingModel: Model<Consulting>,
  ) {}

  async create(
    consultingDto: ConsultingDto,
    doctorId: mongoose.Types.ObjectId,
  ) {
    const consulting = await this.consultingModel.create({
      ...consultingDto,
      doctor: doctorId,
    });
    return consulting;
  }

  async getPatientConsultings(patientId: string) {
    if (!mongoose.isValidObjectId(patientId)) {
      throw new BadRequestException('Please provide a valid patient id');
    }
    const data = await this.consultingModel
      .find({ patient: patientId })
      .populate('patient')
      .populate('appointment')
      .populate('doctor', 'name email specialization')
      .sort({ createdAt: -1 })
      .lean();
    return data;
  }
}
