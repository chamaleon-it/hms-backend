import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PatientRegisterDto } from './patient-register.dto';

describe('PatientRegisterDto', () => {
  it('allows age and month for DOB UX helpers', async () => {
    const dto = plainToInstance(PatientRegisterDto, {
      name: 'Test Patient',
      phoneNumber: '9876543210',
      gender: 'Male',
      dateOfBirth: new Date('1990-01-15').toISOString(),
      age: 36,
      month: 2,
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
    expect(dto.age).toBe(36);
    expect(dto.month).toBe(2);
  });

  it('rejects unknown properties when forbidNonWhitelisted is on', async () => {
    const dto = plainToInstance(PatientRegisterDto, {
      name: 'Test Patient',
      phoneNumber: '9876543210',
      gender: 'Female',
      unknownField: 'nope',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(
      errors.some((e) => e.property === 'unknownField' || e.constraints?.whitelistValidation),
    ).toBe(true);
  });

  it('accepts age/month without dateOfBirth', async () => {
    const dto = plainToInstance(PatientRegisterDto, {
      name: 'Infant Patient',
      phoneNumber: '9876543210',
      gender: 'Female',
      age: 0,
      month: 6,
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
  });
});
