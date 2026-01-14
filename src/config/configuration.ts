// export default () => ({
//   databaseUrl: process.env.DATABASE_URL as string,
//   secret: {
//     accessToken: 'accessTokenaccessToken',
//     refreshToken: 'refreshTokenrefreshToken',
//     forgotPassword: 'forgotPasswordforgotPassword',
//   },
//   in_house_lab_id: process.env.IN_HOUSE_LAB_ID,
//   in_house_pharmacy_id: process.env.IN_HOUSE_PHARMACY_ID as string,
// });


export default () => ({
  databaseUrl: "mongodb+srv://root:hms321@hms.rtnjqlm.mongodb.net/mark?retryWrites=true&w=majority&appName=HMS", // "mongodb://localhost:27017/dev", //process.env.DATABASE_URL as string,
  secret: {
    accessToken: 'accessTokenaccessToken',
    refreshToken: 'refreshTokenrefreshToken',
    forgotPassword: 'forgotPasswordforgotPassword',
  },
  in_house_lab_id: "696491f1d123c2740e924a7a", //process.env.IN_HOUSE_LAB_ID,
  in_house_pharmacy_id: "696491f1d123c2740e924a7a", //process.env.IN_HOUSE_PHARMACY_ID as string,
});