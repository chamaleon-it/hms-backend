import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter } from './schemas/counter.schema';

@Injectable()
export class CountersService {
  constructor(
    @InjectModel(Counter.name) private counterModel: Model<Counter>,
  ) {}

  async getNextSequence(sequenceName: string, startFrom = 1): Promise<number> {
    const counter = await this.counterModel.findOneAndUpdate(
      { _id: sequenceName },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    if (counter.seq < startFrom) {
      const updated = await this.counterModel.findOneAndUpdate(
        { _id: sequenceName },
        { $set: { seq: startFrom } },
        { new: true },
      );
      return updated?.seq ?? startFrom;
    }

    return counter.seq;
  }
}
