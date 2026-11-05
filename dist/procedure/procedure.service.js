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
exports.ProcedureService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importStar(require("mongoose"));
const procedure_schema_1 = require("./schemas/procedure.schema");
function withoutCatalogPrice(doc) {
    if (!doc || typeof doc !== 'object')
        return doc;
    const { price: _price, ...rest } = doc;
    if (Array.isArray(rest.subProcedures)) {
        rest.subProcedures = rest.subProcedures.map((sub) => {
            const { price: _subPrice, ...subRest } = sub || {};
            return subRest;
        });
    }
    return rest;
}
let ProcedureService = class ProcedureService {
    procedureModel;
    constructor(procedureModel) {
        this.procedureModel = procedureModel;
    }
    async onModuleInit() {
        await this.procedureModel.updateMany({}, { $unset: { price: '', 'subProcedures.$[].price': '' } });
        await this.procedureModel.db
            .collection('consultings')
            .updateMany({}, { $unset: { 'procedure.$[].price': '' } });
    }
    async createProcedure(dto) {
        const hasSubs = dto.hasSubProcedures ||
            (Array.isArray(dto.subProcedures) && dto.subProcedures.length > 0);
        const procedure = new this.procedureModel({
            ...dto,
            hasSubProcedures: Boolean(hasSubs),
            subProcedures: (dto.subProcedures || []).map((sp) => ({
                ...sp,
                _id: sp._id && mongoose_2.default.isValidObjectId(sp._id) ? new mongoose_2.Types.ObjectId(sp._id) : new mongoose_2.Types.ObjectId(),
                isDeleted: sp.isDeleted ?? false,
                status: sp.status || 'Active',
            })),
        });
        return await procedure.save();
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
                { 'subProcedures.name': searchRegex },
                { 'subProcedures.code': searchRegex },
                { 'subProcedures.description': searchRegex },
            ];
        }
        const procedures = await this.procedureModel
            .find(filter)
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        return procedures.map((p) => withoutCatalogPrice({
            ...p,
            subProcedures: (p.subProcedures || []).filter((sp) => !sp.isDeleted),
        }));
    }
    async findOne(id) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException(`Invalid procedure ID: ${id}`);
        }
        const procedure = await this.procedureModel
            .findOne({ _id: id, isDeleted: false })
            .lean()
            .exec();
        if (!procedure) {
            throw new common_1.NotFoundException(`Procedure with id ${id} not found`);
        }
        return withoutCatalogPrice({
            ...procedure,
            subProcedures: (procedure.subProcedures || []).filter((sp) => !sp.isDeleted),
        });
    }
    async updateProcedure(id, dto) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException(`Invalid procedure ID: ${id}`);
        }
        const existing = await this.procedureModel.findOne({
            _id: id,
            isDeleted: false,
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Procedure with id ${id} not found`);
        }
        if (dto.name !== undefined)
            existing.name = dto.name;
        if (dto.code !== undefined)
            existing.code = dto.code;
        if (dto.description !== undefined)
            existing.description = dto.description;
        if (dto.status !== undefined)
            existing.status = dto.status;
        if (dto.hasSubProcedures !== undefined)
            existing.hasSubProcedures = dto.hasSubProcedures;
        if (Array.isArray(dto.subProcedures)) {
            existing.subProcedures = dto.subProcedures.map((sp) => ({
                ...sp,
                _id: sp._id && mongoose_2.default.isValidObjectId(sp._id)
                    ? new mongoose_2.Types.ObjectId(sp._id)
                    : new mongoose_2.Types.ObjectId(),
                isDeleted: sp.isDeleted ?? false,
                status: sp.status || 'Active',
            }));
            existing.hasSubProcedures = existing.subProcedures.length > 0;
        }
        return await existing.save();
    }
    async softDeleteProcedure(id) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException(`Invalid procedure ID: ${id}`);
        }
        const procedure = await this.procedureModel.findOne({ _id: id });
        if (!procedure) {
            throw new common_1.NotFoundException(`Procedure with id ${id} not found`);
        }
        procedure.isDeleted = true;
        if (Array.isArray(procedure.subProcedures) && procedure.subProcedures.length > 0) {
            procedure.subProcedures.forEach((sp) => {
                sp.isDeleted = true;
            });
        }
        return await procedure.save();
    }
    async addSubProcedure(procedureId, dto) {
        if (!mongoose_2.default.isValidObjectId(procedureId)) {
            throw new common_1.BadRequestException(`Invalid procedure ID: ${procedureId}`);
        }
        const newSubProc = {
            _id: new mongoose_2.Types.ObjectId(),
            name: dto.name,
            code: dto.code || undefined,
            description: dto.description || undefined,
            status: dto.status || 'Active',
            isDeleted: false,
        };
        const procedure = await this.procedureModel
            .findOneAndUpdate({ _id: procedureId, isDeleted: false }, {
            $push: { subProcedures: newSubProc },
            $set: { hasSubProcedures: true },
        }, { new: true })
            .exec();
        if (!procedure) {
            throw new common_1.NotFoundException(`Procedure with id ${procedureId} not found`);
        }
        return procedure;
    }
    async updateSubProcedure(procedureId, subProcId, dto) {
        if (!mongoose_2.default.isValidObjectId(procedureId) ||
            !mongoose_2.default.isValidObjectId(subProcId)) {
            throw new common_1.BadRequestException('Invalid procedure or sub-procedure ID');
        }
        const updateFields = {};
        if (dto.name !== undefined)
            updateFields['subProcedures.$.name'] = dto.name;
        if (dto.code !== undefined)
            updateFields['subProcedures.$.code'] = dto.code;
        if (dto.description !== undefined)
            updateFields['subProcedures.$.description'] = dto.description;
        if (dto.status !== undefined)
            updateFields['subProcedures.$.status'] = dto.status;
        if (dto.isDeleted !== undefined)
            updateFields['subProcedures.$.isDeleted'] = dto.isDeleted;
        const procedure = await this.procedureModel
            .findOneAndUpdate({
            _id: procedureId,
            isDeleted: false,
            'subProcedures._id': new mongoose_2.Types.ObjectId(subProcId),
        }, { $set: updateFields }, { new: true })
            .exec();
        if (!procedure) {
            throw new common_1.NotFoundException(`Sub-procedure with id ${subProcId} in procedure ${procedureId} not found`);
        }
        return procedure;
    }
    async softDeleteSubProcedure(procedureId, subProcId) {
        return await this.updateSubProcedure(procedureId, subProcId, {
            isDeleted: true,
        });
    }
    async resolveProcedureItems(items) {
        if (!Array.isArray(items) || items.length === 0) {
            return [];
        }
        const allProcedures = await this.procedureModel
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
                    item.subProcedureId ||
                        item.procedureId ||
                        item._id ||
                        '';
            }
            if (!targetId)
                continue;
            let foundAsSub = false;
            for (const p of allProcedures) {
                const sub = (p.subProcedures || []).find((sp) => String(sp._id) === String(targetId) && !sp.isDeleted);
                if (sub) {
                    resolved.push({
                        procedureId: p._id,
                        subProcedureId: String(sub._id),
                        name: sub.name,
                        parentName: p.name,
                        code: sub.code || p.code || null,
                    });
                    foundAsSub = true;
                    break;
                }
            }
            if (foundAsSub)
                continue;
            const mainProc = allProcedures.find((p) => String(p._id) === String(targetId));
            if (mainProc) {
                resolved.push({
                    procedureId: mainProc._id,
                    subProcedureId: null,
                    name: mainProc.name,
                    parentName: null,
                    code: mainProc.code || null,
                });
            }
            else if (typeof item === 'object' && item.name) {
                resolved.push({
                    procedureId: item.procedureId && mongoose_2.default.isValidObjectId(item.procedureId)
                        ? new mongoose_2.Types.ObjectId(item.procedureId)
                        : new mongoose_2.Types.ObjectId(),
                    subProcedureId: item.subProcedureId || null,
                    name: item.name,
                    parentName: item.parentName || null,
                    code: item.code || null,
                });
            }
        }
        return resolved;
    }
};
exports.ProcedureService = ProcedureService;
exports.ProcedureService = ProcedureService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(procedure_schema_1.Procedure.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ProcedureService);
//# sourceMappingURL=procedure.service.js.map