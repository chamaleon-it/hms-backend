export default () => ({
  databaseUrl: process.env.DATABASE_URL as string,
  secret: {
    accessToken: 'accessTokenaccessToken',
    refreshToken: 'refreshTokenrefreshToken',
    forgotPassword:"forgotPasswordforgotPassword"
  },
});
