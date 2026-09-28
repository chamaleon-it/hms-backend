/**
 * Fail-fast env validation. JWT secrets are always required.
 * In production, also require LIS_API_KEY, CORS_ORIGINS, and DATABASE_URL.
 */
export function validateEnv(): void {
  const missing: string[] = [];

  const alwaysRequired = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_FORGOT_SECRET',
  ];

  for (const key of alwaysRequired) {
    if (!process.env[key]?.trim()) {
      missing.push(key);
    }
  }

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    for (const key of ['DATABASE_URL', 'LIS_API_KEY', 'CORS_ORIGINS']) {
      if (!process.env[key]?.trim()) {
        missing.push(key);
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Refusing to start.',
    );
  }
}
