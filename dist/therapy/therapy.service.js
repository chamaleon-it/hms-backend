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
exports.TherapyService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importStar(require("mongoose"));
const therapy_schema_1 = require("./schemas/therapy.schema");
function withoutCatalogPrice(doc) {
    if (!doc || typeof doc !== 'object')
        return doc;
    const { price: _price, ...rest } = doc;
    if (Array.isArray(rest.subTherapies)) {
        rest.subTherapies = rest.subTherapies.map((sub) => {
            const { price: _subPrice, ...subRest } = sub || {};
            return subRest;
        });
    }
    return rest;
}
let TherapyService = class TherapyService {
    therapyModel;
    constructor(therapyModel) {
        this.therapyModel = therapyModel;
    }
    async onModuleInit() {
        await this.therapyModel.updateMany({}, { $unset: { price: '', 'subTherapies.$[].price': '' } });
        await this.therapyModel.db
            .collection('consultings')
            .updateMany({}, { $unset: { 'therapy.$[].price': '' } });
    }
    async createTherapy(dto) {
        const hasSubs = dto.hasSubTherapies ||
            (Array.isArray(dto.subTherapies) && dto.subTherapies.length > 0);
        const therapy = new this.therapyModel({
            ...dto,
            hasSubTherapies: Boolean(hasSubs),
            subTherapies: (dto.subTherapies || []).map((st) => ({
                ...st,
                _id: st._id && mongoose_2.default.isValidObjectId(st._id)
                    ? new mongoose_2.Types.ObjectId(st._id)
                    : new mongoose_2.Types.ObjectId(),
                isDeleted: st.isDeleted ?? false,
                status: st.status || 'Active',
            })),
        });
        return await therapy.save();
    }
    async findAll(search, status) {
        const filter = { isDeleted: false };
        if (status && status !== 'all') {
            filter.status = { $regex: new RegExp(`^${status}$`, 'i') };
        }
        if (search && search.trim() !== '') {
            const searchRegex = { $regex: search.trim(), $options: 'i' };
            filter.$or = [
                { name: searchRegex },
                { code: searchRegex },
                { description: searchRegex },
                { 'subTherapies.name': searchRegex },
                { 'subTherapies.code': searchRegex },
                { 'subTherapies.description': searchRegex },
            ];
        }
        const therapies = await this.therapyModel
            .find(filter)
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        return therapies.map((t) => withoutCatalogPrice({
            ...t,
            subTherapies: (t.subTherapies || []).filter((st) => !st.isDeleted),
        }));
    }
    async findOne(id) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException(`Invalid therapy ID: ${id}`);
        }
        const therapy = await this.therapyModel
            .findOne({ _id: id, isDeleted: false })
            .lean()
            .exec();
        if (!therapy) {
            throw new common_1.NotFoundException(`Therapy with id ${id} not found`);
        }
        return withoutCatalogPrice({
            ...therapy,
            subTherapies: (therapy.subTherapies || []).filter((st) => !st.isDeleted),
        });
    }
    async updateTherapy(id, dto) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException(`Invalid therapy ID: ${id}`);
        }
        const existing = await this.therapyModel.findOne({
            _id: id,
            isDeleted: false,
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Therapy with id ${id} not found`);
        }
        if (dto.name !== undefined)
            existing.name = dto.name;
        if (dto.code !== undefined)
            existing.code = dto.code;
        if (dto.description !== undefined)
            existing.description = dto.description;
        if (dto.status !== undefined)
            existing.status = dto.status;
        if (dto.hasSubTherapies !== undefined)
            existing.hasSubTherapies = dto.hasSubTherapies;
        if (Array.isArray(dto.subTherapies)) {
            existing.subTherapies = dto.subTherapies.map((st) => ({
                ...st,
                _id: st._id && mongoose_2.default.isValidObjectId(st._id)
                    ? new mongoose_2.Types.ObjectId(st._id)
                    : new mongoose_2.Types.ObjectId(),
                isDeleted: st.isDeleted ?? false,
                status: st.status || 'Active',
            }));
            existing.hasSubTherapies = existing.subTherapies.length > 0;
        }
        return await existing.save();
    }
    async softDeleteTherapy(id) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException(`Invalid therapy ID: ${id}`);
        }
        const therapy = await this.therapyModel.findOne({ _id: id });
        if (!therapy) {
            throw new common_1.NotFoundException(`Therapy with id ${id} not found`);
        }
        therapy.isDeleted = true;
        if (Array.isArray(therapy.subTherapies) && therapy.subTherapies.length > 0) {
            therapy.subTherapies.forEach((st) => {
                st.isDeleted = true;
            });
        }
        return await therapy.save();
    }
    async addSubTherapy(therapyId, dto) {
        if (!mongoose_2.default.isValidObjectId(therapyId)) {
            throw new common_1.BadRequestException(`Invalid therapy ID: ${therapyId}`);
        }
        const newSubTherapy = {
            _id: new mongoose_2.Types.ObjectId(),
            name: dto.name,
            code: dto.code || undefined,
            description: dto.description || undefined,
            status: dto.status || 'Active',
            isDeleted: false,
        };
        const therapy = await this.therapyModel
            .findOneAndUpdate({ _id: therapyId, isDeleted: false }, {
            $push: { subTherapies: newSubTherapy },
            $set: { hasSubTherapies: true },
        }, { new: true })
            .exec();
        if (!therapy) {
            throw new common_1.NotFoundException(`Therapy with id ${therapyId} not found`);
        }
        return therapy;
    }
    async updateSubTherapy(therapyId, subTherapyId, dto) {
        if (!mongoose_2.default.isValidObjectId(therapyId) ||
            !mongoose_2.default.isValidObjectId(subTherapyId)) {
            throw new common_1.BadRequestException('Invalid therapy or sub-therapy ID');
        }
        const updateFields = {};
        if (dto.name !== undefined)
            updateFields['subTherapies.$.name'] = dto.name;
        if (dto.code !== undefined)
            updateFields['subTherapies.$.code'] = dto.code;
        if (dto.description !== undefined)
            updateFields['subTherapies.$.description'] = dto.description;
        if (dto.status !== undefined)
            updateFields['subTherapies.$.status'] = dto.status;
        if (dto.isDeleted !== undefined)
            updateFields['subTherapies.$.isDeleted'] = dto.isDeleted;
        const therapy = await this.therapyModel
            .findOneAndUpdate({
            _id: therapyId,
            isDeleted: false,
            'subTherapies._id': new mongoose_2.Types.ObjectId(subTherapyId),
        }, { $set: updateFields }, { new: true })
            .exec();
        if (!therapy) {
            throw new common_1.NotFoundException(`Sub-therapy with id ${subTherapyId} in therapy ${therapyId} not found`);
        }
        return therapy;
    }
    async softDeleteSubTherapy(therapyId, subTherapyId) {
        return await this.updateSubTherapy(therapyId, subTherapyId, {
            isDeleted: true,
        });
    }
    async resolveTherapyItems(items) {
        if (!Array.isArray(items) || items.length === 0) {
            return [];
        }
        const allTherapies = await this.therapyModel
            .find({ isDeleted: false })
            .lean()
            .exec();
        const resolved = [];
        for (const item of items) {
            if (!item)
                continue;
            let targetId = '';
            if (typeof item === 'string') {
                targetId = item.trim();
            }
            else if (typeof item === 'object') {
                targetId =
                    item.subTherapyId ||
                        item.therapyId ||
                        item._id ||
                        '';
            }
            if (!targetId)
                continue;
            let foundAsSub = false;
            for (const t of allTherapies) {
                const sub = (t.subTherapies || []).find((st) => String(st._id) === String(targetId) && !st.isDeleted);
                if (sub) {
                    resolved.push({
                        therapyId: t._id,
                        subTherapyId: String(sub._id),
                        name: sub.name,
                        parentName: t.name,
                        code: sub.code || t.code || null,
                    });
                    foundAsSub = true;
                    break;
                }
            }
            if (foundAsSub)
                continue;
            const mainTherapy = allTherapies.find((t) => String(t._id) === String(targetId));
            if (mainTherapy) {
                resolved.push({
                    therapyId: mainTherapy._id,
                    subTherapyId: null,
                    name: mainTherapy.name,
                    parentName: null,
                    code: mainTherapy.code || null,
                });
            }
            else if (typeof item === 'object' && item.name) {
                resolved.push({
                    therapyId: item.therapyId && mongoose_2.default.isValidObjectId(item.therapyId)
                        ? new mongoose_2.Types.ObjectId(item.therapyId)
                        : new mongoose_2.Types.ObjectId(),
                    subTherapyId: item.subTherapyId || null,
                    name: item.name,
                    parentName: item.parentName || null,
                    code: item.code || null,
                });
            }
        }
        return resolved;
    }
};
exports.TherapyService = TherapyService;
exports.TherapyService = TherapyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(therapy_schema_1.Therapy.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], TherapyService);
//# sourceMappingURL=therapy.service.js.map