import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/schemas/user.schema';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockContext = (user: { role?: string } | null): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows when no roles metadata is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(mockContext({ role: UserRole.PHARMACY }))).toBe(
      true,
    );
  });

  it('allows Super Admin for Admin/Super Admin routes', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    expect(
      guard.canActivate(mockContext({ role: UserRole.SUPER_ADMIN })),
    ).toBe(true);
  });

  it('blocks Pharmacy from Admin-only stock edit roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    expect(() =>
      guard.canActivate(mockContext({ role: UserRole.PHARMACY })),
    ).toThrow(ForbiddenException);
  });

  it('blocks missing user role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);
    expect(() => guard.canActivate(mockContext(null))).toThrow(
      ForbiddenException,
    );
  });
});
