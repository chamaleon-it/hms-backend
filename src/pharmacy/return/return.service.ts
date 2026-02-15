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
import { Billing } from 'src/billing/schemas/billing.schema';
import configuration from 'src/config/configuration';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ReturnService {
  constructor(
    @InjectModel(Return.name) private returnModel: Model<Return>,
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
    private readonly itemsService: ItemsService,
    private readonly usersService: UsersService,
  ) { }

  async create(createReturnDto: CreateReturnDto) {
    createReturnDto.billNo = `R-${createReturnDto.billNo}`
    const existingBilling = await this.billingModel.exists({ mrn: createReturnDto.billNo })
    if (!existingBilling) {
      throw new BadRequestException('Thi bill already returned or bill number is invalid');
    }
    const data = await this.returnModel.create(createReturnDto);

    await this.billingModel.create({
      patient: createReturnDto.patient,
      user: configuration().in_house_pharmacy_id,
      items: await Promise.all(
        createReturnDto.items.map(async (e) => {
          const item = await this.itemsService.getItem(e.name);
          const quantity = e.quantity;
          const total = e.unitPrice * quantity;
          return {
            name: item.name,
            quantity,
            unitPrice: e.unitPrice,
            total,
          };
        })
      ),
      mrn: createReturnDto.billNo,
      transactionType: "Return",
    })

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

  private async generateUniqueMRN(prefix: string): Promise<string> {
    let mrn: string;
    let exists = true;

    do {
      const randomNum = Math.floor(1000000 + Math.random() * 9000000);
      mrn = `${prefix}${randomNum}`;

      const existing = await this.billingModel.exists({ mrn });
      exists = !!existing;
    } while (exists);

    return mrn;
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
