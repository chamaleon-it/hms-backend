import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ConsultingDto } from './dto/consulting.dto';
import { normalizeDigestiveSystem } from './digestive-system';

describe('normalizeDigestiveSystem', () => {
  it('wraps a legacy single value', () => {
    expect(normalizeDigestiveSystem('GERD')).toEqual(['GERD']);
  });

  it('keeps every selected value', () => {
    expect(normalizeDigestiveSystem(['Bloating', 'GERD'])).toEqual([
      'Bloating',
      'GERD',
    ]);
  });

  it('treats empty values as unset', () => {
    expect(normalizeDigestiveSystem(null)).toBeNull();
    expect(normalizeDigestiveSystem('')).toBeNull();
    expect(normalizeDigestiveSystem([])).toBeNull();
  });
});

describe('ConsultingDto digestiveSystem', () => {
  const base = {
    patient: '507f1f77bcf86cd799439011',
    appointment: '507f1f77bcf86cd799439012',
    test: [],
  };

  it('accepts a legacy string and exposes it as a list', async () => {
    const dto = plainToInstance(ConsultingDto, {
      ...base,
      medicalParameters: { digestiveSystem: 'Normal' },
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.medicalParameters?.digestiveSystem).toEqual(['Normal']);
  });

  it('accepts several digestive values', async () => {
    const dto = plainToInstance(ConsultingDto, {
      ...base,
      medicalParameters: { digestiveSystem: ['Bloating', 'APD', 'GERD'] },
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.medicalParameters?.digestiveSystem).toEqual([
      'Bloating',
      'APD',
      'GERD',
    ]);
  });

  it('accepts an empty digestive value', async () => {
    const dto = plainToInstance(ConsultingDto, {
      ...base,
      medicalParameters: { digestiveSystem: null },
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.medicalParameters?.digestiveSystem).toBeNull();
  });
});
