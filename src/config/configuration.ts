export default () => ({
  databaseUrl: process.env.DATABASE_URL as string,
  secret: {
    accessToken: 'accessTokenaccessToken',
    refreshToken: 'refreshTokenrefreshToken',
    forgotPassword: 'forgotPasswordforgotPassword',
  },
  /** Env-specific user ObjectIds — never hard-code per-database values here. */
  in_house_lab_id: (process.env.IN_HOUSE_LAB_ID || '').trim(),
  in_house_pharmacy_id: (process.env.IN_HOUSE_PHARMACY_ID || '').trim(),
  in_house_reception_id: (process.env.IN_HOUSE_RECEPTION || '').trim(),
  in_doctor_id: (process.env.IN_DOCTOR_ID || '').trim(),
  /** Shared secret for LIS machine ingest (`POST /lab/report/lis-result`). */
  lisApiKey: (process.env.LIS_API_KEY || '').trim(),
});
