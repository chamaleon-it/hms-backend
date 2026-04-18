import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserRole } from '../schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { UpdateGeneralDto } from './dto/update-general.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { UpdateNotificationsDto } from './dto/update-notifications.dto';
import { UpdateCatalogueDto } from './dto/update-catalogue.dto';
import { UpdateReportLayoutDto } from './dto/update-report-layout.dto';

@Injectable()
export class LabService {
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
          'lab.general.owner': dto.owner,
          'lab.general.gstin': dto.gstin,
        },
      },
      { new: true, runValidators: true }, // return updated document
    );

    if (!pharmacy) {
      throw new NotFoundException('Lab not found');
    }

    return pharmacy;
  }

  async updateCatalogue(
    user: mongoose.Types.ObjectId,
    dto: UpdateCatalogueDto,
  ) {
    const updated = await this.userModel.findByIdAndUpdate(
      user,
      {
        $set: {
          'lab.catalogue.showProfilesOnPatientBill':
            dto.showProfilesOnPatientBill,
          'lab.catalogue.allowEditingPanelComposition':
            dto.allowEditingPanelComposition,
        },
      },
      { new: true, runValidators: true },
    );

    if (!updated) {
      throw new NotFoundException('Lab Not Found');
    }

    return updated;
  }

  async getLab() {
    const data = await this.userModel
      .find(
        {
          role: UserRole.LAB,
        },
        {
          name: 1,
          'lab.tests': 1,
        },
      )
      .lean()
      .exec();
    return data.map((d) => ({ _id: d._id, name: d.name }));
  }

  async updateBilling(user: mongoose.Types.ObjectId, dto: UpdateBillingDto) {
    const updated = await this.userModel.findByIdAndUpdate(
      user,
      {
        $set: {
          'lab.billing.prefix': dto.prefix,
          'lab.billing.defaultGst': dto.defaultGst,
          'lab.billing.roundOff': dto.roundOff,
          'lab.billing.autoPrintAfterSave': dto.autoPrintAfterSave,
        },
      },
      { new: true, runValidators: true },
    );

    if (!updated) {
      throw new NotFoundException('Lab Not Found');
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
          'lab.notifications.whatsapp': dto.whatsapp,
          'lab.notifications.sms': dto.sms,
          'lab.notifications.inApp': dto.inApp,
          ...(dto.note && {
            'lab.notifications.note': dto.note,
          }),
        },
      },
      { new: true, runValidators: true, context: 'query' },
    );

    if (!updated) {
      throw new NotFoundException('Lab Not found');
    }

    return updated;
  }

  async updateReportLayout(user: mongoose.Types.ObjectId, dto: UpdateReportLayoutDto) {
    const updated = await this.userModel.findByIdAndUpdate(
      user,
      {
        $set: {
          'lab.reportLayout': dto.reportLayout,
        },
      },
      { new: true, runValidators: true, context: 'query' },
    );

    if (!updated) {
      throw new NotFoundException('Lab Not found');
    }



    return updated;
  }
}
