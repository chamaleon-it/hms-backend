import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import configuration from 'src/config/configuration';

/**
 * Protects machine-to-machine LIS ingest endpoints without requiring a user JWT.
 * Callers must send header `x-lis-api-key` (or `x-api-key`) matching env `LIS_API_KEY`.
 * Fails closed when the server key is unset.
 */
@Injectable()
export class LisApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = configuration().lisApiKey?.trim();
    if (!expected) {
      throw new UnauthorizedException(
        'LIS API key is not configured on the server (set LIS_API_KEY).',
      );
    }

    const request = context.switchToHttp().getRequest();
    const provided =
      request.headers?.['x-lis-api-key'] ||
      request.headers?.['x-api-key'] ||
      request.headers?.['X-LIS-API-KEY'];

    if (!provided || String(provided) !== expected) {
      throw new UnauthorizedException('Invalid or missing LIS API key.');
    }

    return true;
  }
}
