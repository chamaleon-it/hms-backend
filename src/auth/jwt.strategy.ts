import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import configuration from 'src/config/configuration';
import { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { UserRole } from 'src/users/schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configuration().secret.accessToken,
    });
  }

  // async
  validate(payload: JWTUserInterface) {
    if (!Object.values(UserRole).includes(payload.role as UserRole)) {
      throw new UnauthorizedException('This account role is no longer supported.');
    }
    return { id: payload.id, email: payload.email, role: payload.role };
  }
}
