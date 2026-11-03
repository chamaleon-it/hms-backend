"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("../schemas/user.schema");
const mongoose_2 = require("mongoose");
let LabService = class LabService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    async updateGeneral(userId, dto) {
        const pharmacy = await this.userModel.findByIdAndUpdate(userId, {
            $set: {
                name: dto.name,
                phoneNumber: dto.phoneNumber,
                email: dto.email,
                address: dto.address,
                'lab.general.owner': dto.owner,
                'lab.general.gstin': dto.gstin,
            },
        }, { new: true, runValidators: true });
        if (!pharmacy) {
            throw new common_1.NotFoundException('Lab not found');
        }
        return pharmacy;
    }
    async updateCatalogue(user, dto) {
        const updated = await this.userModel.findByIdAndUpdate(user, {
            $set: {
                'lab.catalogue.showProfilesOnPatientBill': dto.showProfilesOnPatientBill,
                'lab.catalogue.allowEditingPanelComposition': dto.allowEditingPanelComposition,
            },
        }, { new: true, runValidators: true });
        if (!updated) {
            throw new common_1.NotFoundException('Lab Not Found');
        }
        return updated;
    }
    async getLab() {
        const data = await this.userModel
            .find({
            role: user_schema_1.UserRole.LAB,
        }, {
            name: 1,
            'lab.tests': 1,
        })
            .lean()
            .exec();
        return data.map((d) => ({ _id: d._id, name: d.name }));
    }
    async updateBilling(user, dto) {
        const updated = await this.userModel.findByIdAndUpdate(user, {
            $set: {
                'lab.billing.prefix': dto.prefix,
                'lab.billing.defaultGst': dto.defaultGst,
                'lab.billing.roundOff': dto.roundOff,
                'lab.billing.autoPrintAfterSave': dto.autoPrintAfterSave,
            },
        }, { new: true, runValidators: true });
        if (!updated) {
            throw new common_1.NotFoundException('Lab Not Found');
        }
        return updated;
    }
    async updateNotifications(user, dto) {
        const updated = await this.userModel.findByIdAndUpdate(user, {
            $set: {
                'lab.notifications.whatsapp': dto.whatsapp,
                'lab.notifications.sms': dto.sms,
                'lab.notifications.inApp': dto.inApp,
                ...(dto.note && {
                    'lab.notifications.note': dto.note,
                }),
            },
        }, { new: true, runValidators: true, context: 'query' });
        if (!updated) {
            throw new common_1.NotFoundException('Lab Not found');
        }
        return updated;
    }
    async updateReportLayout(user, dto) {
        const updated = await this.userModel.findByIdAndUpdate(user, {
            $set: {
                'lab.panelPerPage': dto.panelPerPage,
            },
        }, { new: true, runValidators: true, context: 'query' });
        if (!updated) {
            throw new common_1.NotFoundException('Lab Not found');
        }
        return updated;
    }
};
exports.LabService = LabService;
exports.LabService = LabService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], LabService);
//# sourceMappingURL=lab.service.js.map