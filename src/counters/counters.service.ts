import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleInit,
} from '@nestjs/common';
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

/** Fixed keys that domain services register for boot-time first-time seed. */
export const BOOT_SEED_COUNTER_KEYS = [
  COUNTER_KEYS.PATIENT_PID,
  COUNTER_KEYS.PHARMACY_ORDER,
  COUNTER_KEYS.PHARMACY_PURCHASE,
  COUNTER_KEYS.LAB_REPORT,
] as const;

function isDuplicateKeyError(err: unknown): boolean {
  return !!(err && typeof err === 'object' && (err as { code?: number }).code === 11000);
}

type BootSeeder = {
  key: string;
  getInitialMax: () => Promise<number>;
};

@Injectable()
export class CountersService implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(CountersService.name);
  /** Domain services register getInitialMax during construction; run once at boot. */
  private readonly bootSeeders: BootSeeder[] = [];

  constructor(
    @InjectModel(Counter.name) private readonly counterModel: Model<Counter>,
  ) {}

  /**
   * Register a first-time seed callback for a fixed counter key.
   * Called from domain service constructors; executed in onApplicationBootstrap.
   * Invoice prefixes are intentionally not registered — seeded on first use via next().
   */
  registerBootSeed(key: string, getInitialMax: () => Promise<number>): void {
    this.bootSeeders.push({ key, getInitialMax });
  }

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
   * After all modules construct (and register boot seeders), seed any missing
   * fixed counter keys. Idempotent: existing keys are never overwritten.
   */
  async onApplicationBootstrap() {
    await this.seedRegisteredCounters();
  }

  /**
   * First-time seed only: if a doc with `key` already exists, skip.
   * If missing, create with `seq` from getInitialMax and `name = key`.
   * Never lowers or resets an existing seq.
   * @returns true if a new counter was created, false if skipped / raced.
   */
  async seedIfMissing(
    key: string,
    getInitialMax: () => Promise<number> = async () => 0,
  ): Promise<boolean> {
    const existing = await this.counterModel.findOne({ key }).lean().exec();
    if (existing) {
      return false;
    }

    const max = Math.max(0, Math.floor(Number(await getInitialMax()) || 0));
    try {
      await this.counterModel.create({ key, name: key, seq: max });
      this.logger.log(`Seeded counter ${key} at seq=${max} (first-time only)`);
      return true;
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        // Another process/boot raced — existing doc wins; do not overwrite.
        return false;
      }
      this.logger.warn(
        `Counter seedIfMissing(${key}) failed: ${(err as Error)?.message || err}`,
      );
      throw err;
    }
  }

  /** Run all registered boot seeders. Safe to call every boot. */
  async seedRegisteredCounters(): Promise<void> {
    for (const { key, getInitialMax } of this.bootSeeders) {
      try {
        await this.seedIfMissing(key, getInitialMax);
      } catch (err: any) {
        // Do not crash boot on seed failure — next()/peek() still fall back.
        this.logger.warn(
          `Boot seed for ${key} skipped/failed: ${err?.message || err}`,
        );
      }
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

  /**
   * Read the next sequence without consuming it.
   * Use for UI previews; allocate with `next` / `nextFormatted` on create.
   */
  async peek(
    key: string,
    getInitialMax: () => Promise<number> = async () => 0,
  ): Promise<number> {
    const existing = await this.counterModel.findOne({ key }).lean().exec();
    if (!existing) {
      const max = Math.max(0, Math.floor(Number(await getInitialMax()) || 0));
      return max + 1;
    }
    return Math.max(0, Math.floor(Number(existing.seq) || 0)) + 1;
  }

  /**
   * Raise the counter floor so `seq >= minSeq` without issuing a new id.
   * Used when a client-supplied numeric id was accepted on create.
   */
  async ensureAtLeast(key: string, minSeq: number): Promise<void> {
    const floor = Math.max(0, Math.floor(Number(minSeq) || 0));
    if (floor <= 0) return;

    try {
      await this.counterModel
        .findOneAndUpdate(
          { key },
          {
            $max: { seq: floor },
            $setOnInsert: { key, name: key },
          },
          { upsert: true, setDefaultsOnInsert: true },
        )
        .lean()
        .exec();
    } catch (err) {
      if (!isDuplicateKeyError(err)) {
        throw err;
      }
      // Race / legacy name_1 — seed then $max without upsert.
      try {
        await this.counterModel.create({ key, name: key, seq: floor });
      } catch (createErr) {
        if (!isDuplicateKeyError(createErr)) {
          throw createErr;
        }
        await this.counterModel
          .findOneAndUpdate({ key }, { $max: { seq: floor } })
          .lean()
          .exec();
      }
    }
  }

  private formatSeq(
    seq: number,
    opts: { prefix?: string; pad?: number } = {},
  ): string {
    const body =
      opts.pad && opts.pad > 0
        ? String(seq).padStart(opts.pad, '0')
        : String(seq);
    return `${opts.prefix ?? ''}${body}`;
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
    return this.formatSeq(seq, opts);
  }

  /** Peek next formatted id without consuming the counter. */
  async peekFormatted(
    key: string,
    opts: {
      prefix?: string;
      pad?: number;
      getInitialMax?: () => Promise<number>;
    } = {},
  ): Promise<string> {
    const seq = await this.peek(key, opts.getInitialMax);
    return this.formatSeq(seq, opts);
  }
}
