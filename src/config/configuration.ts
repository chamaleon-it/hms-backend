const LEGACY_ACCESS = 'accessTokenaccessToken';
const LEGACY_REFRESH = 'refreshTokenrefreshToken';
const LEGACY_FORGOT = 'forgotPasswordforgotPassword';

function resolveSecret(
  envName: string,
  envValue: string | undefined,
  legacyFallback: string,
): string {
  const fromEnv = (envValue || '').trim();
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `Missing required env ${envName}. Set a strong secret before starting production.`,
    );
  }

  // Local/dev only — never ship production with these defaults.
  return legacyFallback;
}

export default () => ({
  databaseUrl: process.env.DATABASE_URL as string,
  secret: {
    accessToken: resolveSecret(
      'JWT_ACCESS_SECRET',
      process.env.JWT_ACCESS_SECRET,
      LEGACY_ACCESS,
    ),
    refreshToken: resolveSecret(
      'JWT_REFRESH_SECRET',
      process.env.JWT_REFRESH_SECRET,
      LEGACY_REFRESH,
    ),
    forgotPassword: resolveSecret(
      'JWT_FORGOT_PASSWORD_SECRET',
      process.env.JWT_FORGOT_PASSWORD_SECRET,
      LEGACY_FORGOT,
    ),
  },
  /** Env-specific user ObjectIds — never hard-code per-database values here. */
  in_house_lab_id: (process.env.IN_HOUSE_LAB_ID || '').trim(),
  in_house_pharmacy_id: (process.env.IN_HOUSE_PHARMACY_ID || '').trim(),
  in_house_reception_id: (process.env.IN_HOUSE_RECEPTION || '').trim(),
  in_doctor_id: (process.env.IN_DOCTOR_ID || '').trim(),
  /** Shared secret for LIS machine ingest (`POST /lab/report/lis-result`). */
  lisApiKey: (process.env.LIS_API_KEY || '').trim(),
  /**
   * Comma-separated CORS origins. Empty = reflect request Origin (dev).
   * Production should set e.g. https://synapsehms.com,https://www.synapsehms.com
   */
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
});
