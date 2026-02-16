import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { UpdateGeneralDto } from './dto/update-general.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { UpdateNotificationsDto } from './dto/update-notifications.dto';

@Injectable()
export class PharmacyService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }

  async updateGeneral(userId: mongoose.Types.ObjectId, dto: UpdateGeneralDto) {
    const pharmacy = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          name: dto.name,
          phoneNumber: dto.phoneNumber,
          email: dto.email,
          address: dto.address,
          'pharmacy.general.owner': dto.owner,
          'pharmacy.general.gstin': dto.gstin,
        },
      },
      { new: true, runValidators: true }, // return updated document
    );

    if (!pharmacy) {
      throw new NotFoundException('Pharmacy not found');
    }

    return pharmacy;
  }

  async updateBilling(user: mongoose.Types.ObjectId, dto: UpdateBillingDto) {
    const updated = await this.userModel.findByIdAndUpdate(
      user,
      {
        $set: {
          'pharmacy.billing.prefix': dto.prefix,
          'pharmacy.billing.defaultGst': dto.defaultGst,
          'pharmacy.billing.roundOff': dto.roundOff,
          'pharmacy.billing.autoPrintAfterSave': dto.autoPrintAfterSave,
          'pharmacy.billing.autoGenerateBill': dto.autoGenerateBill,
          'pharmacy.billing.autoGeneratePrescription': dto.autoGeneratePrescription,
        },
      },
      { new: true, runValidators: true },
    );

    if (!updated) {
      throw new NotFoundException('Pharmacy Not Found');
    }

    return updated;
  }

  async updateInventory(
    user: mongoose.Types.ObjectId,
    dto: UpdateInventoryDto,
  ) {
    const updated = await this.userModel.findByIdAndUpdate(
      user,
      {
        $set: {
          'pharmacy.inventory.lowStockThreshold': dto.lowStockThreshold,
          'pharmacy.inventory.expiryAlert': dto.expiryAlert,
          'pharmacy.inventory.allowNegativeStock': dto.allowNegativeStock,
        },
      },
      { new: true, runValidators: true, context: 'query' },
    );

    if (!updated) {
      throw new NotFoundException('Pharmacy Not found');
    }

    return updated;
  }

  async updateNotifications(
    user: mongoose.Types.ObjectId,
    dto: UpdateNotificationsDto,
  ) {
    const updated = await this.userModel.findByIdAndUpdate(
      user,
      {
        $set: {
          'pharmacy.notifications.whatsapp': dto.whatsapp,
          'pharmacy.notifications.sms': dto.sms,
          'pharmacy.notifications.inApp': dto.inApp,
          ...(dto.note && {
            'pharmacy.notifications.note': dto.note,
          }),
        },
      },
      { new: true, runValidators: true, context: 'query' },
    );

    if (!updated) {
      throw new NotFoundException('Pharmacy Not found');
    }

    return updated;
  }
}
