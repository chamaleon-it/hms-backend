import { AuthService } from './auth.service';
import { UserStatus } from 'src/users/schemas/user.schema';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService.login sanitization (C1/H1)', () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const userDoc: any = {
    _id: 'u1',
    email: 'qa@test.com',
    role: 'Pharmacy',
    name: 'QA',
    status: UserStatus.ACTIVE,
    password: '$2b$10$hash',
    refreshToken: 'old',
    save,
    toObject() {
      return {
        _id: this._id,
        email: this.email,
        role: this.role,
        name: this.name,
        status: this.status,
        password: this.password,
        refreshToken: this.refreshToken,
      };
    },
  };

  const userModel = {
    findOne: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(userDoc),
    }),
  };

  const jwtService = {
    signAsync: jest
      .fn()
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token-new'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token-new');
    userDoc.password = '$2b$10$hash';
    userDoc.refreshToken = 'old';
  });

  it('returns user without password/hash/refreshToken but keeps top-level tokens', async () => {
    const service = new AuthService(userModel as any, jwtService as any);
    const result = await service.login({
      email: 'qa@test.com',
      password: 'secret',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token-new');
    expect(result.user).toMatchObject({
      email: 'qa@test.com',
      role: 'Pharmacy',
      name: 'QA',
    });
    expect(result.user).not.toHaveProperty('password');
    expect(result.user).not.toHaveProperty('refreshToken');
  });
});
