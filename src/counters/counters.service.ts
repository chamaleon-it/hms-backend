import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter } from './schemas/counter.schema';

/** Canonical counter keys used across the HMS. */
export const COUNTER_KEYS = {
  PATIENT_PID: 'patient_pid',
  PHARMACY_ORDER: 'pharmacy_order',
  PHARMACY_PURCHASE: 'pharmacy_purchase',
  LAB_REPORT: 'lab_report',
  /** Per-prefix invoice/bill: invoice:INV, invoice:LAB, … */
  invoice: (prefix: string) =>
    `invoice:${String(prefix || 'INV').trim().toUpperCase()}`,
} as const;

@Injectable()
export class CountersService {
  constructor(
    @InjectModel(Counter.name) private readonly counterModel: Model<Counter>,
  ) {}

  /**
   * Atomically increment and return the next sequence for `key`.
   * On first use, seeds from `getInitialMax()` (typically max existing value)
   * so sequences continue without collisions.
   */
  async next(
    key: string,
    getInitialMax: () => Promise<number> = async () => 0,
  ): Promise<number> {
    const existing = await this.counterModel.findOne({ key }).lean().exec();
    if (!existing) {
      const max = Math.max(0, Math.floor(Number(await getInitialMax()) || 0));
      try {
        await this.counterModel.create({ key, seq: max });
      } catch {
        // Race: another process inserted the same key — continue to $inc.
      }
    }

    const updated = await this.counterModel
      .findOneAndUpdate({ key }, { $inc: { seq: 1 } }, { new: true })
      .lean()
      .exec();

    if (!updated) {
      // Extremely unlikely after upsert race; retry once with seed 0.
      const retry = await this.counterModel
        .findOneAndUpdate(
          { key },
          { $inc: { seq: 1 } },
          { new: true, upsert: true, setDefaultsOnInsert: true },
        )
        .lean()
        .exec();
      return retry?.seq ?? 1;
    }

    return updated.seq;
  }

  /** Format helpers for call sites that need prefixed / padded IDs. */
  async nextFormatted(
    key: string,
    opts: {
      prefix?: string;
      pad?: number;
      getInitialMax?: () => Promise<number>;
    } = {},
  ): Promise<string> {
    const seq = await this.next(key, opts.getInitialMax);
    const body =
      opts.pad && opts.pad > 0
        ? String(seq).padStart(opts.pad, '0')
        : String(seq);
    return `${opts.prefix ?? ''}${body}`;
  }
}
