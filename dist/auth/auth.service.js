"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("../users/schemas/user.schema");
const mongoose_2 = require("mongoose");
const bcrypt = __importStar(require("bcrypt"));
const jwt_1 = require("@nestjs/jwt");
const configuration_1 = __importDefault(require("../config/configuration"));
let AuthService = class AuthService {
    userModel;
    jwtService;
    constructor(userModel, jwtService) {
        this.userModel = userModel;
        this.jwtService = jwtService;
    }
    async login(loginDto) {
        const user = await this.userModel
            .findOne({
            $or: [
                { email: loginDto.usernameOrEmail },
                { username: loginDto.usernameOrEmail },
            ],
        })
            .select('+password');
        const passwordHash = user?.password ||
            '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX12';
        const isPasswordMatched = await bcrypt.compare(loginDto.password, passwordHash);
        if (!user || !isPasswordMatched) {
            throw new common_1.BadRequestException('Invalid username or password. Please try again.');
        }
        if (user.status === user_schema_1.UserStatus.PENDING) {
            throw new common_1.BadRequestException('Your profile is under review. The verification process usually takes up to 24 hours.');
        }
        else if (user.status === user_schema_1.UserStatus.INACTIVE) {
            throw new common_1.BadRequestException('This profile is inactive. Please contact the administrator for further assistance.');
        }
        else if (user.status === user_schema_1.UserStatus.BLOCKED) {
            throw new common_1.BadRequestException('This profile is blocked. Please contact the administrator for further assistance.');
        }
        const accessToken = await this.jwtService.signAsync({ id: user._id, email: user.email, role: user.role }, {
            secret: (0, configuration_1.default)().secret.accessToken,
            expiresIn: '15m',
        });
        const refreshToken = await this.jwtService.signAsync({ id: user._id }, {
            secret: (0, configuration_1.default)().secret.refreshToken,
            expiresIn: '15d',
        });
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();
        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.refreshToken;
        return {
            user: userObj,
            accessToken,
            refreshToken,
        };
    }
    async getRefreshToken(getRefreshTokenDto) {
        try {
            const decoded = await this.jwtService.verifyAsync(getRefreshTokenDto.refreshToken, {
                secret: (0, configuration_1.default)().secret.refreshToken,
            });
            if (!decoded)
                throw new common_1.UnauthorizedException('Refresh token is missing or expired.');
            const { id } = decoded;
            const user = await this.userModel.findById(id).select('+refreshToken');
            if (!user) {
                throw new common_1.BadRequestException('User not found');
            }
            const accessToken = await this.jwtService.signAsync({ id: user._id, email: user.email, role: user.role }, {
                secret: (0, configuration_1.default)().secret.accessToken,
                expiresIn: '15m',
            });
            const refreshToken = await this.jwtService.signAsync({ id: user._id }, {
                secret: (0, configuration_1.default)().secret.refreshToken,
                expiresIn: '15d',
            });
            user.refreshToken = refreshToken;
            await user.save();
            const userObj = user.toObject();
            delete userObj.password;
            delete userObj.refreshToken;
            return { user: userObj, accessToken, refreshToken };
        }
        catch (error) {
            throw error;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map