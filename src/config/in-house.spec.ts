import { BadRequestException } from '@nestjs/common';
import mongoose from 'mongoose';
import { getInHouseObjectId, requireInHouseId } from '../config/in-house';

jest.mock('../config/configuration', () => ({
  __esModule: true,
  default: () => ({
    in_house_pharmacy_id: process.env.__TEST_PHARM || '',
    in_house_lab_id: process.env.__TEST_LAB || '',
    in_house_reception_id: process.env.__TEST_RECEPTION || '',
    in_doctor_id: process.env.__TEST_DOCTOR || '',
  }),
}));

describe('InHouse config helpers (H5)', () => {
  const validId = new mongoose.Types.ObjectId().toHexString();

  afterEach(() => {
    delete process.env.__TEST_PHARM;
    delete process.env.__TEST_LAB;
    delete process.env.__TEST_RECEPTION;
    delete process.env.__TEST_DOCTOR;
  });

  it('throws clear 400 when IN_HOUSE_* is missing', () => {
    process.env.__TEST_PHARM = '';
    expect(() => requireInHouseId('pharmacy')).toThrow(BadRequestException);
    expect(() => requireInHouseId('pharmacy')).toThrow(/IN_HOUSE_PHARMACY_ID/);
  });

  it('throws when value is not a valid ObjectId', () => {
    process.env.__TEST_LAB = 'not-an-object-id';
    expect(() => requireInHouseId('lab')).toThrow(BadRequestException);
  });

  it('returns ObjectId when configured correctly', () => {
    process.env.__TEST_PHARM = validId;
    expect(requireInHouseId('pharmacy')).toBe(validId);
    expect(getInHouseObjectId('pharmacy').toHexString()).toBe(validId);
  });
});
