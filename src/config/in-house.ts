import {
  BadRequestException,
  Logger,
  OnModuleInit,
  Injectable,
} from '@nestjs/common';
import mongoose from 'mongoose';
import configuration from './configuration';

const logger = new Logger('InHouseConfig');

export type InHouseKey = 'pharmacy' | 'lab' | 'reception' | 'doctor';

const ENV_NAMES: Record<InHouseKey, string> = {
  pharmacy: 'IN_HOUSE_PHARMACY_ID',
  lab: 'IN_HOUSE_LAB_ID',
  reception: 'IN_HOUSE_RECEPTION',
  doctor: 'IN_DOCTOR_ID',
};

function readRaw(key: InHouseKey): string | undefined {
  const cfg = configuration();
  switch (key) {
    case 'pharmacy':
      return cfg.in_house_pharmacy_id;
    case 'lab':
      return cfg.in_house_lab_id;
    case 'reception':
      return cfg.in_house_reception_id;
    case 'doctor':
      return cfg.in_doctor_id;
  }
}

/** Return configured ObjectId string or throw a clear 400 (never invent IDs). */
export function requireInHouseId(key: InHouseKey): string {
  const raw = (readRaw(key) || '').trim();
  const env = ENV_NAMES[key];
  if (!raw) {
    throw new BadRequestException(
      `${env} is not configured. Set a valid user ObjectId for this environment.`,
    );
  }
  if (!mongoose.isValidObjectId(raw)) {
    throw new BadRequestException(
      `${env} is not a valid ObjectId: "${raw}"`,
    );
  }
  return raw;
}

export function getInHouseObjectId(key: InHouseKey): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(requireInHouseId(key));
}

/** Soft check at boot — warn on missing/invalid; never hard-code env-specific IDs. */
@Injectable()
export class InHouseConfigValidator implements OnModuleInit {
  onModuleInit() {
    (Object.keys(ENV_NAMES) as InHouseKey[]).forEach((key) => {
      const raw = (readRaw(key) || '').trim();
      const env = ENV_NAMES[key];
      if (!raw) {
        logger.warn(
          `${env} is unset — features that auto-assign this user will fail safely until configured.`,
        );
        return;
      }
      if (!mongoose.isValidObjectId(raw)) {
        logger.error(`${env} is set but is not a valid ObjectId: "${raw}"`);
      }
    });
  }
}
