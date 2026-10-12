function requireJwtSecret(name: string): string {
  const secret = process.env[name]?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(`${name} must be configured with at least 32 characters.`);
  }
  return secret;
}

export default () => ({
  databaseUrl: process.env.DATABASE_URL as string,
  secret: {
    accessToken: requireJwtSecret('ACCESS_TOKEN_SECRET'),
    refreshToken: requireJwtSecret('REFRESH_TOKEN_SECRET'),
    forgotPassword: requireJwtSecret('FORGOT_PASSWORD_SECRET'),
  },
  /** Env-specific user ObjectIds — never hard-code per-database values here. */
  in_house_lab_id: (process.env.IN_HOUSE_LAB_ID || '').trim(),
  in_house_pharmacy_id: (process.env.IN_HOUSE_PHARMACY_ID || '').trim(),
  in_house_reception_id: (process.env.IN_HOUSE_RECEPTION || '').trim(),
  in_doctor_id: (process.env.IN_DOCTOR_ID || '').trim(),
  /** Shared secret for LIS machine ingest (`POST /lab/report/lis-result`). */
  lisApiKey: (process.env.LIS_API_KEY || '').trim(),
});
