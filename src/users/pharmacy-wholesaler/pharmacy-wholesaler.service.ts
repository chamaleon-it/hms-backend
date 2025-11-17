import { Injectable, NotFoundException } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { UpdateGeneralDto } from './dto/update-general.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { UpdatedLogisticsDto } from './dto/update-logistics.dto';
import { UpdateNotificationsDto } from './dto/update-notifications.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../schemas/user.schema';

@Injectable()
export class PharmacyWholesalerService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async updateGeneral(userId: mongoose.Types.ObjectId, dto: UpdateGeneralDto) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: {
            name: dto.name,
            phoneNumber: dto.phoneNumber,
            email: dto.email,
            address: dto.address,
            'pharmacyWholesaler.general.contactPerson': dto.contactPerson,
            'pharmacyWholesaler.general.gstin': dto.gstin,
          },
        },
        {
          new: true,
          runValidators: true,
          context: 'query',
        },
      )
      .exec();

    if (!updatedUser) throw new NotFoundException('User not found');

    return updatedUser;
  }

  async updatePricing(userId: mongoose.Types.ObjectId, dto: UpdatePricingDto) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: {
            'pharmacyWholesaler.pricing.allowCreditOrder': dto.allowCreditOrder,
            'pharmacyWholesaler.pricing.creditPeriod': dto.creditPeriod,
            'pharmacyWholesaler.pricing.defaultMargin': dto.defaultMargin,
            'pharmacyWholesaler.pricing.minOrderValue': dto.minOrderValue,
          },
        },
        {
          new: true,
          runValidators: true,
          context: 'query',
        },
      )
      .exec();

    if (!updatedUser) throw new NotFoundException('User not found');

    return updatedUser;
  }

  async updateLogistics(
    userId: mongoose.Types.ObjectId,
    dto: UpdatedLogisticsDto,
  ) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: {
            'pharmacyWholesaler.logistics.allowPartialDispatch':
              dto.allowPartialDispatch,
            'pharmacyWholesaler.logistics.autoMergeOrders': dto.autoMergeOrders,
            'pharmacyWholesaler.logistics.defaultCourier': dto.defaultCourier,
            'pharmacyWholesaler.logistics.returnWindow': dto.returnWindow,
            'pharmacyWholesaler.logistics.sameDayDispatchCutOf':
              dto.sameDayDispatchCutOf,
          },
        },
        {
          new: true,
          runValidators: true,
          context: 'query',
        },
      )
      .exec();

    if (!updatedUser) throw new NotFoundException('User not found');

    return updatedUser;
  }

  async updateNotifications(
    userId: mongoose.Types.ObjectId,
    dto: UpdateNotificationsDto,
  ) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: {
            'pharmacyWholesaler.notifications.email': dto.email,
            'pharmacyWholesaler.notifications.inApp': dto.inApp,
            'pharmacyWholesaler.notifications.sms': dto.sms,
            'pharmacyWholesaler.notifications.whatsapp': dto.whatsapp,
            'pharmacyWholesaler.notifications.note': dto.note ?? null,
          },
        },
        {
          new: true,
          runValidators: true,
          context: 'query',
        },
      )
      .exec();

    if (!updatedUser) throw new NotFoundException('User not found');

    return updatedUser;
  }
}
