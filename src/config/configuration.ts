export default () => ({
  databaseUrl: process.env.DATABASE_URL as string,
  atlasDatabaseUrl: (process.env.ATLAS_DATABASE_URL || process.env.MONGO_ATLAS_URI) as string,
  secret: {
    accessToken: process.env.JWT_ACCESS_SECRET as string,
    refreshToken:
      process.env.JWT_REFRESH_SECRET as string,
    forgotPassword:
      process.env.JWT_FORGOT_SECRET as string,
  },
  in_house_lab_id: process.env.IN_HOUSE_LAB_ID,
  in_house_pharmacy_id: process.env.IN_HOUSE_PHARMACY_ID as string,
  in_house_reception_id: process.env.IN_HOUSE_RECEPTION as string,
});

