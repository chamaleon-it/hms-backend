import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReturnDto } from './dto/create-return.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Return, ReturnReason } from './schemas/return.schema';
import mongoose, { Model } from 'mongoose';
import { ItemsService } from '../items/items.service';

@Injectable()
export class ReturnService {
  constructor(
    @InjectModel(Return.name) private returnModel: Model<Return>,
    private readonly itemsService: ItemsService,
  ) {}

  async create(createReturnDto: CreateReturnDto) {
    const data = await this.returnModel.create(createReturnDto);

    const validReasonForQuantityAdd = [
      ReturnReason.AdverseReaction,
      ReturnReason.DoctorChangedRx,
      ReturnReason.NotRequired,
      ReturnReason.Other,
      ReturnReason.QualityIssue,
      ReturnReason.WrongItem,
    ];
    const items = createReturnDto.items.filter(
      (item) => validReasonForQuantityAdd.includes(item.reason) || !item.reason,
    );
    items.forEach(async (item) => {
      await this.itemsService.increaseItem(item.name, item.quantity);
    });

    return data;
  }

  async findAll() {
    const data = await this.returnModel
      .find()
      .populate('patient', 'name phoneNumber email address mrn')
      .populate('order', 'mrn')
      .populate(
        'items.name',
        '-createdAt -updatedAt -expiryDate -purchasePrice ',
      )
      .lean()
      .exec();
    return data;
  }

  async findOne(id: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Please provide a valid return id');
    }
    const data = await this.returnModel
      .findById(id)
      .populate('patient', 'name phoneNumber email address mrn')
      .populate('order', 'mrn')
      .populate(
        'items.name',
        '-createdAt -updatedAt -expiryDate -purchasePrice ',
      )
      .lean()
      .exec();

    if (!data) {
      throw new NotFoundException(
        'Sorry no return data available for this id.',
      );
    }
    return data;
  }

  async findByPatient(patientId: string) {
    if (!mongoose.isValidObjectId(patientId)) {
      throw new BadRequestException('Please provide a valid patient id');
    }
    const data = await this.returnModel
      .find({ patient: patientId })
      // .populate('patient', 'name phoneNumber email address mrn')
      .populate('order', 'mrn')
      .populate(
        'items.name',
        '-createdAt -updatedAt -expiryDate -purchasePrice ',
      )
      .lean()
      .exec();

    return data;
  }
}
