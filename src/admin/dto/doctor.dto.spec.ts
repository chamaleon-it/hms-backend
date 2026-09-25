import { CreateDoctorDto, UpdateDoctorDto } from './doctor.dto';
import { UserStatus } from '../../users/schemas/user.schema';

describe('Admin doctor DTOs (no body:any)', () => {
  it('CreateDoctorDto accepts clinical profile fields without role', () => {
    const dto = new CreateDoctorDto();
    dto.name = 'Dr Test';
    dto.email = 'dr@test.com';
    dto.status = UserStatus.ACTIVE;
    expect(dto).not.toHaveProperty('role');
    expect(dto.name).toBe('Dr Test');
  });

  it('UpdateDoctorDto does not include role field', () => {
    const dto = new UpdateDoctorDto();
    dto.name = 'Updated';
    dto.status = UserStatus.INACTIVE;
    expect(dto).not.toHaveProperty('role');
  });
});
