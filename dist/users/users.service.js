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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("./schemas/user.schema");
const mongoose_2 = __importStar(require("mongoose"));
const bcrypt = __importStar(require("bcrypt"));
let UsersService = class UsersService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    async createUser(createUserDto) {
        const requestedRole = (createUserDto.role || '').trim();
        if (requestedRole === user_schema_1.UserRole.ADMIN ||
            !Object.values(user_schema_1.UserRole).includes(requestedRole) ||
            requestedRole === user_schema_1.UserRole.NOT_ASSIGNED) {
            throw new common_1.BadRequestException('Invalid role. Please select a valid account type.');
        }
        const isUserExist = await this.userModel.findOne({
            $or: [
                { email: createUserDto.email },
                { username: createUserDto.username },
            ],
        });
        if (isUserExist) {
            if (isUserExist.email === createUserDto.email) {
                throw new common_1.BadRequestException('This email address is already registered with us.');
            }
            else {
                throw new common_1.BadRequestException('This username is already taken.');
            }
        }
        createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
        const user = await this.userModel.create({
            ...createUserDto,
            role: requestedRole,
            status: user_schema_1.UserStatus.PENDING,
        });
        const { password, ...data } = user.toObject();
        return data;
    }
    async getProfile(user) {
        const data = await this.userModel.findById(user.id).lean();
        if (!data) {
            throw new common_1.BadRequestException('User profile not found.');
        }
        return data;
    }
    async getPharmacyBillingPrefix(id) {
        const user = await this.userModel
            .findById(id)
            .select('pharmacy.billing.prefix')
            .lean()
            .exec();
        return user?.pharmacy?.billing?.prefix ?? 'INV';
    }
    async getPharmacyInventoryAllowNegativeStock(id) {
        const user = await this.userModel
            .findById(id)
            .select('pharmacy.inventory.allowNegativeStock')
            .lean()
            .exec();
        return user?.pharmacy?.inventory?.allowNegativeStock ?? false;
    }
    async getPharmacyBilling(id) {
        const user = await this.userModel
            .findById(id)
            .select('pharmacy.billing')
            .lean();
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        return user.pharmacy.billing;
    }
    async forgotPassword(forgotPasswordDto) {
        await this.userModel.findOne({
            email: forgotPasswordDto.email,
        });
    }
    async getAllDoctors(includeDeleted = false) {
        const filter = { role: user_schema_1.UserRole.DOCTOR };
        if (!includeDeleted) {
            filter.isDeleted = { $ne: true };
        }
        const data = await this.userModel
            .find(filter)
            .select('name username email phoneNumber address profilePic signature availability consultationFee qualification specialization department designation licenseNo status isDeleted createdAt updatedAt')
            .sort({ name: 1 })
            .lean();
        return data;
    }
    async findUserRoleById(id) {
        const user = await this.userModel.findById(id).select('role').lean();
        return user?.role ?? null;
    }
    async softDeleteUser(id) {
        const user = await this.userModel.findByIdAndUpdate(id, { isDeleted: true, status: user_schema_1.UserStatus.INACTIVE }, { new: true });
        if (!user) {
            throw new common_1.NotFoundException('Doctor not found.');
        }
        return user;
    }
    async getUsersByRole(role) {
        const data = await this.userModel
            .find({ role })
            .select('name email phoneNumber address profilePic status availability specialization qualification licenseNo designation consultationFee')
            .sort({ name: 1 })
            .lean();
        return data;
    }
    async getAllPharmacyWholesaler() {
        const data = await this.userModel
            .find({ role: user_schema_1.UserRole.PHARMACY_WHOLESALER })
            .select('name email phoneNumber address profilePic')
            .lean();
        return data;
    }
    async updateUser(id, updateUserDto) {
        const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, {
            new: true,
            runValidators: true,
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        return user;
    }
    async updatePassword(id, updatePasswordDto) {
        const user = await this.userModel.findById(id).select('password');
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        const isPasswordMatch = await bcrypt.compare(updatePasswordDto.currentPassword, user.password);
        if (!isPasswordMatch) {
            throw new common_1.BadRequestException('Incorrect current password. Please try again.');
        }
        user.password = await bcrypt.hash(updatePasswordDto.password, 10);
        await user.save();
    }
    async getDoctorAvailability(id) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException('Please provide a valid doctor id');
        }
        const user = await this.userModel
            .findById(id)
            .select('availability')
            .lean();
        if (!user) {
            throw new common_1.NotFoundException('Doctor not found.');
        }
        if (!user.availability) {
            throw new common_1.BadRequestException('Doctor is not available');
        }
        return user.availability;
    }
    async syncConsultationValues(id, value) {
        const user = await this.userModel.findById(id).select('consultationValues');
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        user.consultationValues = value;
        await user.save();
        return null;
    }
    async getConsultationValues(id) {
        const user = await this.userModel
            .findById(id)
            .select('consultationValues')
            .lean();
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        return user.consultationValues;
    }
    async getUserById(id) {
        if (!mongoose_2.default.isValidObjectId(id))
            return null;
        return this.userModel.findById(id).lean().exec();
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map