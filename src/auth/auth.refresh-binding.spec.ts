import { AuthService } from './auth.service';
import { UserStatus } from 'src/users/schemas/user.schema';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService refresh-token binding + login enumeration', () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const userDoc: any = {
    _id: 'u1',
    email: 'qa@test.com',
    role: 'Pharmacy',
    name: 'QA',
    status: UserStatus.ACTIVE,
    password: '$2b$10$hash',
    refreshToken: 'stored-refresh',
    save,
    toObject() {
      return { ...this };
    },
  };

  const userModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    userDoc.refreshToken = 'stored-refresh';
    userModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(userDoc),
    });
    userModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(userDoc),
    });
    jwtService.verifyAsync.mockResolvedValue({ id: 'u1' });
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token-new');
  });

  it('uses the same error message for unknown email and bad password', async () => {
    const service = new AuthService(userModel as any, jwtService as any);

    userModel.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(null),
    });
    await expect(
      service.login({ email: 'missing@test.com', password: 'x' }),
    ).rejects.toThrow(/Invalid email or password/);

    userModel.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(userDoc),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
    await expect(
      service.login({ email: 'qa@test.com', password: 'wrong' }),
    ).rejects.toThrow(/Invalid email or password/);
  });

  it('rejects refresh when token does not match stored value', async () => {
    const service = new AuthService(userModel as any, jwtService as any);
    await expect(
      service.getRefreshToken({ refreshToken: 'stolen-or-stale' }),
    ).rejects.toThrow(/Refresh token is not matching/);
  });

  it('rotates tokens when refresh matches stored value', async () => {
    const service = new AuthService(userModel as any, jwtService as any);
    jwtService.signAsync.mockReset();
    jwtService.signAsync
      .mockResolvedValueOnce('access-2')
      .mockResolvedValueOnce('refresh-2');

    const result = await service.getRefreshToken({
      refreshToken: 'stored-refresh',
    });
    expect(result.accessToken).toBe('access-2');
    expect(result.refreshToken).toBe('refresh-2');
    expect(userDoc.refreshToken).toBe('refresh-2');
    expect(save).toHaveBeenCalled();
  });
});
