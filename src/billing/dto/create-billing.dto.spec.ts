import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBillingDto } from './create-billing.dto';

describe('CreateBillingDto doctor validation', () => {
  it('validates a MongoDB doctor id before the service converts it', async () => {
    const doctorId = '507f1f77bcf86cd799439011';
    const dto = plainToInstance(CreateBillingDto, {
      patient: '507f1f77bcf86cd799439012',
      doctor: doctorId,
    });

    const errors = await validate(dto);

    expect(dto.doctor).toBe(doctorId);
    expect(errors.some((error) => error.property === 'doctor')).toBe(false);
  });
});
