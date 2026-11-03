"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    databaseUrl: process.env.DATABASE_URL,
    atlasDatabaseUrl: (process.env.ATLAS_DATABASE_URL || process.env.MONGO_ATLAS_URI),
    secret: {
        accessToken: process.env.JWT_ACCESS_SECRET,
        refreshToken: process.env.JWT_REFRESH_SECRET,
        forgotPassword: process.env.JWT_FORGOT_SECRET,
    },
    in_house_lab_id: process.env.IN_HOUSE_LAB_ID,
    in_house_pharmacy_id: process.env.IN_HOUSE_PHARMACY_ID,
    in_house_reception_id: process.env.IN_HOUSE_RECEPTION,
});
//# sourceMappingURL=configuration.js.map