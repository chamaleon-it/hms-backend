"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
function validateEnv() {
    const missing = [];
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
        throw new Error(`Missing required environment variable(s): ${missing.join(', ')}. ` +
            'Refusing to start.');
    }
}
//# sourceMappingURL=validate-env.js.map