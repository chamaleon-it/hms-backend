import { Injectable } from '@nestjs/common';
import { CreateBillingDto } from './dto/create-billing.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Billing } from './schemas/billing.schema';
import mongoose, { Model } from 'mongoose';

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
  ) {}


   private async generateUniqueMRN(): Promise<string> {
    let mrn: string;
    let exists = true;

    do {
      const randomNum = Math.floor(1000000 + Math.random() * 9000000);
      mrn = `INV${randomNum}`;

      // Check if MRN already exists
      const existing = await this.billingModel.exists({ mrn });
      exists = !!existing;
    } while (exists);

    return mrn;
  }

  async generateBill(createBill: CreateBillingDto) {
    createBill.mrn = await this.generateUniqueMRN()
    const data = await this.billingModel.create(createBill);
    return data;
  }

async getBills(user: mongoose.Types.ObjectId) {
  return this.billingModel
    .find({ user }, "mrn createdAt patient items.total cash online insurance")
    .populate("patient", "name mrn")
    .lean();
}

}
