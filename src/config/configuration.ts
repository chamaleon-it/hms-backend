export default () => ({
  databaseUrl: process.env.DATABASE_URL as string,
  secret: {
    accessToken: process.env.JWT_ACCESS_SECRET || 'fallbackAccessTokenSecret',
    refreshToken: process.env.JWT_REFRESH_SECRET || 'fallbackRefreshTokenSecret',
    forgotPassword: process.env.JWT_FORGOT_SECRET || 'fallbackForgotPasswordSecret',
  },
  in_house_lab_id: process.env.IN_HOUSE_LAB_ID,
  in_house_pharmacy_id: process.env.IN_HOUSE_PHARMACY_ID as string,
  in_doctor_id: process.env.IN_DOCTOR_ID as string,
});
