export default () => ({
  databaseUrl: process.env.DATABASE_URL as string,
  secret: {
    accessToken: 'accessTokenaccessToken',
    refreshToken: 'refreshTokenrefreshToken',
    forgotPassword: 'forgotPasswordforgotPassword',
  },
  in_house_lab_id: process.env.IN_HOUSE_LAB_ID,
  in_house_pharmacy_id: process.env.IN_HOUSE_PHARMACY_ID as string,
});
