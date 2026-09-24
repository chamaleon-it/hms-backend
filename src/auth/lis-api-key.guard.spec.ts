import { UnauthorizedException } from '@nestjs/common';
import { LisApiKeyGuard } from './lis-api-key.guard';

jest.mock('src/config/configuration', () => ({
  __esModule: true,
  default: jest.fn(() => ({ lisApiKey: '' })),
}));

import configuration from 'src/config/configuration';

describe('LisApiKeyGuard (H6)', () => {
  const guard = new LisApiKeyGuard();
  const mockConfig = configuration as unknown as jest.Mock;

  const mockContext = (headers: Record<string, string>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    }) as any;

  beforeEach(() => {
    mockConfig.mockReset();
  });

  it('fails closed when LIS_API_KEY unset', () => {
    mockConfig.mockReturnValue({ lisApiKey: '' });
    expect(() => guard.canActivate(mockContext({}))).toThrow(
      /LIS API key is not configured/,
    );
  });

  it('rejects wrong key and accepts x-lis-api-key / x-api-key', () => {
    mockConfig.mockReturnValue({ lisApiKey: 'secret-lis-key' });
    expect(() =>
      guard.canActivate(mockContext({ 'x-lis-api-key': 'wrong' })),
    ).toThrow(UnauthorizedException);
    expect(
      guard.canActivate(mockContext({ 'x-lis-api-key': 'secret-lis-key' })),
    ).toBe(true);
    expect(
      guard.canActivate(mockContext({ 'x-api-key': 'secret-lis-key' })),
    ).toBe(true);
  });
});
