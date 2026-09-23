// roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './decorators/roles.decorator';
import { JWTUserInterface } from 'src/interface/jwt-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) return true;

    const { user }: { user: JWTUserInterface } = context
      .switchToHttp()
      .getRequest();

    if (!user?.role) {
      throw new ForbiddenException('Insufficient role permissions');
    }

    const allowed = requiredRoles.some(
      (role) => String(role) === String(user.role),
    );
    if (!allowed) {
      throw new ForbiddenException('Insufficient role permissions');
    }
    return true;
  }
}
