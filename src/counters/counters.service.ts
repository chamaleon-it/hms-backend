import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from './schemas/counter.schema';
import { Patient, PatientDocument } from '../patients/schemas/patient.schema';
import { NextFormattedIdDto } from './dto/counter.dto';

@Injectable()
export class CountersService {
  private readonly logger = new Logger(CountersService.name);

  constructor(
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
  ) {}

  /**
   * Initializes or retrieves a counter by key.
   * Handles backward-compatibility with legacy 'name' and 'pid' fields.
   */
  async getOrInitCounter(
    key: string,
    defaultStart = 0,
  ): Promise<CounterDocument> {
    const normalizedKey = key.trim().toLowerCase();

    // Query for key or legacy name field
    let counter = await this.counterModel.findOne({
      $or: [{ key: normalizedKey }, { name: normalizedKey } as any],
    });

    if (!counter) {
      let initialValue = defaultStart;

      // For patient counter, inspect existing patients to start after the highest existing MRN
      if (normalizedKey === 'patient' || normalizedKey === 'pid') {
        const latest = await this.patientModel.aggregate([
          { $match: { mrn: { $regex: /^\d+$/ } } },
          { $addFields: { mrnInt: { $toInt: '$mrn' } } },
          { $match: { mrnInt: { $lt: 10000000 } } },
          { $sort: { mrnInt: -1 } },
          { $limit: 1 },
        ]);

        initialValue =
          latest.length > 0 && latest[0].mrnInt >= 10000
            ? latest[0].mrnInt
            : 10000;
      }

      counter = await this.counterModel.create({
        key: normalizedKey,
        value: initialValue,
      });

      this.logger.log(
        `Initialized counter '${normalizedKey}' with starting value: ${initialValue}`,
      );
    } else {
      // Migrate legacy document fields if necessary
      let needsSave = false;
      const legacyPid = (counter as any).get
        ? (counter as any).get('pid')
        : (counter as any).pid;
      const legacyName = (counter as any).get
        ? (counter as any).get('name')
        : (counter as any).name;

      if (!counter.key && legacyName) {
        counter.key = legacyName;
        needsSave = true;
      }
      if (
        (counter.value === undefined ||
          counter.value === null ||
          counter.value === 0) &&
        legacyPid !== undefined
      ) {
        counter.value = Number(legacyPid);
        needsSave = true;
      }
      if (needsSave) {
        await counter.save();
      }
    }

    return counter;
  }

  /**
   * Increments and returns the next integer sequence for a given key.
   */
  async getNextSequence(key: string, startValue = 0): Promise<number> {
    const counter = await this.getOrInitCounter(key, startValue);
    const nextVal = (counter.value ?? 0) + 1;
    counter.value = nextVal;
    await counter.save();
    return counter.value;
  }

  /**
   * Returns a formatted next identifier (e.g., ORD-00042, INV-1005).
   */
  async getNextFormattedId(
    key: string,
    options?: NextFormattedIdDto,
  ): Promise<string> {
    const counter = await this.getOrInitCounter(key, options?.startValue ?? 0);
    const nextVal = (counter.value ?? 0) + 1;
    counter.value = nextVal;
    if (options?.prefix && !counter.prefix) {
      counter.prefix = options.prefix;
    }
    await counter.save();

    const prefix = options?.prefix ?? counter.prefix ?? '';
    const padLength = options?.padLength ?? 0;
    const numStr =
      padLength > 0 ? String(nextVal).padStart(padLength, '0') : String(nextVal);

    return `${prefix}${numStr}`;
  }

  /**
   * Generates the next unique patient PID.
   * Increments patient counter and verifies uniqueness against Patient collection via while loop.
   */
  async getNextPID(): Promise<string> {
    const counter = await this.getOrInitCounter('patient', 10000);

    let nextPid = (counter.value || 10000) + 1;

    let exists = true;
    while (exists) {
      const existingPatient = await this.patientModel.exists({
        mrn: nextPid.toString(),
      });

      if (existingPatient) {
        nextPid++;
      } else {
        exists = false;
      }
    }

    counter.value = nextPid;
    await counter.save();

    return nextPid.toString();
  }

  /**
   * Returns the current latest sequence value for a key.
   */
  async getLatestSequence(key: string): Promise<number> {
    const counter = await this.getOrInitCounter(key);
    return counter.value ?? 0;
  }

  /**
   * Returns current latest PID stored in the counter along with the next available unique PID.
   */
  async getLatestPID(): Promise<{
    value: number;
    nextPid: string;
    mrn: string;
  }> {
    const counter = await this.getOrInitCounter('patient', 10000);
    const currentVal = counter.value ?? (counter as any).pid ?? 10000;

    let nextPidNum = currentVal + 1;
    let exists = true;
    while (exists) {
      const existing = await this.patientModel.exists({
        mrn: nextPidNum.toString(),
      });
      if (existing) {
        nextPidNum++;
      } else {
        exists = false;
      }
    }

    return {
      value: currentVal,
      nextPid: nextPidNum.toString(),
      mrn: nextPidNum.toString(),
    };
  }

  /**
   * Synchronizes counter value if a manual value higher than the counter is provided.
   */
  async syncSequenceIfHigher(
    key: string,
    manualValue: number,
  ): Promise<void> {
    if (isNaN(manualValue)) return;

    const counter = await this.getOrInitCounter(key);
    if (manualValue > (counter.value ?? 0)) {
      counter.value = manualValue;
      await counter.save();
    }
  }

  /**
   * Helper alias for patient PID synchronization.
   */
  async syncPIDIfHigher(manualPid: number): Promise<void> {
    return this.syncSequenceIfHigher('patient', manualPid);
  }

  /**
   * Sets or updates a counter with a specific value and optional prefix.
   */
  async setSequence(
    key: string,
    value: number,
    prefix?: string,
    description?: string,
  ): Promise<Counter> {
    const normalizedKey = key.trim().toLowerCase();
    const updated = await this.counterModel.findOneAndUpdate(
      { $or: [{ key: normalizedKey }, { name: normalizedKey } as any] },
      {
        $set: {
          key: normalizedKey,
          value,
          ...(prefix !== undefined ? { prefix } : {}),
          ...(description !== undefined ? { description } : {}),
        },
      },
      { new: true, upsert: true },
    );
    return updated;
  }

  /**
   * Lists all existing counters in the system.
   */
  async getAllCounters(): Promise<Counter[]> {
    return this.counterModel.find({}).sort({ key: 1 }).lean();
  }
}
