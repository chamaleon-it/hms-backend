describe('JWT secret configuration', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_FORGOT_PASSWORD_SECRET;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('uses env secrets when provided', () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-value';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-value';
    process.env.JWT_FORGOT_PASSWORD_SECRET = 'test-forgot-secret-value';
    process.env.NODE_ENV = 'development';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const configuration = require('./configuration').default;
    const cfg = configuration();
    expect(cfg.secret.accessToken).toBe('test-access-secret-value');
    expect(cfg.secret.refreshToken).toBe('test-refresh-secret-value');
    expect(cfg.secret.forgotPassword).toBe('test-forgot-secret-value');
  });

  it('fails closed in production when JWT secrets are missing', () => {
    process.env.NODE_ENV = 'production';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const configuration = require('./configuration').default;
    expect(() => configuration()).toThrow(/JWT_ACCESS_SECRET/);
  });
});
