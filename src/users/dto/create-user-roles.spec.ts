import { PUBLIC_REGISTER_ROLES } from './createUser.dto';
import { UserRole } from '../schemas/user.schema';

describe('CreateUserDto public register roles', () => {
  it('allows only Doctor, Pharmacy, Lab', () => {
    expect([...PUBLIC_REGISTER_ROLES].sort()).toEqual(
      [UserRole.DOCTOR, UserRole.LAB, UserRole.PHARMACY].sort(),
    );
  });

  it('rejects privileged roles from public registration allow-list', () => {
    expect(PUBLIC_REGISTER_ROLES).not.toContain(UserRole.ADMIN);
    expect(PUBLIC_REGISTER_ROLES).not.toContain(UserRole.SUPER_ADMIN);
    expect(PUBLIC_REGISTER_ROLES).not.toContain(UserRole.NOT_ASSIGNED);
  });
});
