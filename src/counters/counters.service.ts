import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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

function isDuplicateKeyError(err: unknown): boolean {
  return !!(err && typeof err === 'object' && (err as { code?: number }).code === 11000);
}

@Injectable()
export class CountersService implements OnModuleInit {
  private readonly logger = new Logger(CountersService.name);

  constructor(
    @InjectModel(Counter.name) private readonly counterModel: Model<Counter>,
  ) {}

  /**
   * Drop obsolete unique `name_1` (legacy field) so missing/null `name` no
   * longer causes E11000 when inserting multiple counter docs keyed by `key`.
   * Ensure unique index only on `key`.
   *
   * Manual Atlas fallback if this fails at boot:
   *   db.counters.dropIndex("name_1")
   */
  async onModuleInit() {
    try {
      const collection = this.counterModel.collection;
      const indexes = await collection.indexes();
      const nameIdx = indexes.find((idx) => idx.name === 'name_1');

      if (nameIdx) {
        await collection.dropIndex('name_1');
        this.logger.log(
          'Dropped obsolete unique name_1 index on counters (schema uses key)',
        );
      }

      await collection.createIndex({ key: 1 }, { unique: true, name: 'key_1' });

      // Backfill name=key on any docs still missing name (belt-and-suspenders
      // if name_1 somehow reappears before deploy finishes).
      await collection.updateMany(
        {
          key: { $type: 'string', $gt: '' },
          $or: [{ name: null }, { name: { $exists: false } }, { name: '' }],
        },
        [{ $set: { name: '$key' } }],
      );
    } catch (err: any) {
      // Index ops can fail briefly during deploy; do not crash boot.
      this.logger.warn(
        `Counters index migration skipped/failed (manual: db.counters.dropIndex("name_1")): ${err?.message || err}`,
      );
    }
  }

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
        // Mirror name=key so legacy unique name_1 never sees multiple nulls.
        await this.counterModel.create({ key, name: key, seq: max });
      } catch (err) {
        if (!isDuplicateKeyError(err)) {
          this.logger.warn(
            `Counter create(${key}) failed: ${(err as Error)?.message || err}`,
          );
        }
        // Race on key, or residual name_1 — continue to $inc / recover below.
      }
    } else if (!existing.name) {
      // Heal docs created before name mirroring.
      await this.counterModel
        .updateOne({ key, $or: [{ name: null }, { name: { $exists: false } }] }, { $set: { name: key } })
        .exec()
        .catch(() => undefined);
    }

    const updated = await this.counterModel
      .findOneAndUpdate({ key }, { $inc: { seq: 1 } }, { new: true })
      .lean()
      .exec();

    if (!updated) {
      return this.incrementWithUpsertRecovery(key);
    }

    return updated.seq;
  }

  /**
   * Last-resort upsert. If obsolete `name_1` still rejects null name, seed
   * explicitly with name=key then $inc without upsert.
   */
  private async incrementWithUpsertRecovery(key: string): Promise<number> {
    try {
      const retry = await this.counterModel
        .findOneAndUpdate(
          { key },
          {
            $inc: { seq: 1 },
            // Do not $setOnInsert.seq — conflicts with $inc.seq.
            $setOnInsert: { key, name: key },
          },
          { new: true, upsert: true, setDefaultsOnInsert: true },
        )
        .lean()
        .exec();
      return retry?.seq ?? 1;
    } catch (err) {
      if (!isDuplicateKeyError(err)) {
        throw err;
      }
      this.logger.warn(
        `Counter upsert(${key}) hit duplicate key — recovering with name=key seed. If this persists, run: db.counters.dropIndex("name_1")`,
      );
      try {
        await this.counterModel.create({ key, name: key, seq: 0 });
      } catch (createErr) {
        if (!isDuplicateKeyError(createErr)) {
          throw createErr;
        }
      }
      const recovered = await this.counterModel
        .findOneAndUpdate({ key }, { $inc: { seq: 1 } }, { new: true })
        .lean()
        .exec();
      if (!recovered) {
        throw err;
      }
      return recovered.seq;
    }
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
