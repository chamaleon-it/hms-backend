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
exports.PanelsService = void 0;
const common_1 = require("@nestjs/common");
const panel_schema_1 = require("./schemas/panel.schema");
const mongoose_1 = __importStar(require("mongoose"));
const mongoose_2 = require("@nestjs/mongoose");
const test_schema_1 = require("./schemas/test.schema");
const group_schema_1 = require("./schemas/group.schema");
let PanelsService = class PanelsService {
    panelModel;
    testModel;
    groupModel;
    constructor(panelModel, testModel, groupModel) {
        this.panelModel = panelModel;
        this.testModel = testModel;
        this.groupModel = groupModel;
    }
    async createPanel(createPanelDto) {
        const isExist = await this.panelModel.findOne({
            name: createPanelDto.name,
        });
        if (isExist) {
            throw new common_1.BadRequestException('Panel with this name already exists');
        }
        const panel = new this.panelModel(createPanelDto);
        return panel.save();
    }
    async getPanels() {
        const panels = await this.panelModel
            .find({ status: panel_schema_1.PanelStatus.ACTIVE })
            .select('name price estimatedTime tests mainHeading subheadings testSubheadings method specimen department')
            .populate('tests', 'name unit range code')
            .sort({ _id: 1 })
            .lean()
            .exec();
        return panels.map((panel) => ({
            _id: panel._id.toString(),
            name: panel.name,
            price: panel.price,
            estimatedTime: panel.estimatedTime,
            tests: panel.tests,
            mainHeading: panel.mainHeading,
            subheadings: panel.subheadings || [],
            testSubheadings: panel.testSubheadings || {},
            method: panel.method,
            specimen: panel.specimen,
            department: panel.department,
        }));
    }
    async updatePanel(id, updatePanelDto) {
        const isExist = await this.panelModel.findById(id);
        if (!isExist) {
            throw new common_1.BadRequestException('Panel not found');
        }
        const { tests, ...rest } = updatePanelDto;
        const panel = await this.panelModel.findByIdAndUpdate(id, { ...rest, tests: tests || [] }, { new: true });
        if (!panel) {
            throw new common_1.BadRequestException('Panel not found');
        }
        if (tests) {
            const testDocs = await this.testModel.find({ panels: panel._id });
            for (const t of testDocs) {
                if (!tests.includes(t._id.toString())) {
                    t.panels = t.panels.filter((pId) => pId.toString() !== panel._id.toString());
                    await t.save();
                }
            }
            for (const testId of tests) {
                const testDoc = await this.testModel.findById(testId);
                if (testDoc &&
                    (!testDoc.panels || !testDoc.panels.includes(panel._id))) {
                    if (!testDoc.panels)
                        testDoc.panels = [];
                    testDoc.panels.push(panel._id);
                    await testDoc.save();
                }
            }
        }
        return panel;
    }
    async deletePanel(id) {
        await this.panelModel.findByIdAndUpdate(id, {
            status: panel_schema_1.PanelStatus.DELETED,
        });
    }
    async createTest(dto) {
        const isExist = await this.testModel.exists({ code: dto.code });
        if (isExist && dto.code !== null) {
            throw new common_1.BadRequestException('Test with this code already exists');
        }
        const test = await this.testModel.create(dto);
        return test;
    }
    async getTests() {
        const tests = await this.testModel
            .find()
            .populate('panels', 'name')
            .lean()
            .exec();
        return tests;
    }
    async updateTest(id, dto) {
        const isExist = await this.testModel.exists({
            code: dto.code,
            _id: { $ne: id },
        });
        if (isExist && dto.code !== null) {
            throw new common_1.BadRequestException('Test with this code already exists');
        }
        const test = await this.testModel.findByIdAndUpdate(id, dto, { new: true });
        return test;
    }
    async addTestToPanel(addTestDto) {
        const panel = await this.panelModel.findOne({ name: addTestDto.panelName });
        if (!panel) {
            throw new common_1.BadRequestException('Panel not found');
        }
        for (const testId of addTestDto.tests) {
            const test = await this.testModel.findById(testId);
            if (!test) {
                throw new common_1.BadRequestException(`Test with id ${testId.toString()} not found`);
            }
            if (!test.panels) {
                test.panels = [];
            }
            if (!test.panels.includes(panel._id)) {
                test.panels.push(panel._id);
                await test.save();
            }
        }
        return panel;
    }
    async removeTestFromPanel(addTestDto) {
        const panel = await this.panelModel.findOne({ name: addTestDto.panelName });
        if (!panel) {
            throw new common_1.BadRequestException('Panel not found');
        }
        for (const testId of addTestDto.tests) {
            const test = await this.testModel.findById(testId);
            if (!test) {
                throw new common_1.BadRequestException(`Test with id ${testId.toString()} not found`);
            }
            if (test.panels && test.panels.includes(panel._id)) {
                test.panels = test.panels.filter((panelId) => !panelId.equals(panel._id));
                await test.save();
            }
        }
        return panel;
    }
    async deleteTest(id) {
        if (!mongoose_1.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException('Invalid ID provided.');
        }
        const test = await this.testModel.findByIdAndDelete(id);
        if (!test) {
            throw new common_1.NotFoundException('Test not found.');
        }
        await this.panelModel.updateMany({ tests: id }, { $pull: { tests: id } });
        return test;
    }
    async createGroup(dto) {
        const isExist = await this.groupModel.findOne({ name: dto.name });
        if (isExist)
            throw new common_1.BadRequestException('Group name already exists');
        const group = new this.groupModel(dto);
        return group.save();
    }
    async getGroups() {
        return this.groupModel
            .find({ status: group_schema_1.GroupStatus.ACTIVE })
            .populate('tests', 'name price code')
            .populate('panels', 'name price tests')
            .sort({ _id: 1 })
            .exec();
    }
    async updateGroup(name, dto) {
        const group = await this.groupModel.findOneAndUpdate({ name }, { $set: dto }, { new: true });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        return group;
    }
    async deleteGroup(name) {
        const group = await this.groupModel.findOneAndUpdate({ name }, { $set: { status: group_schema_1.GroupStatus.DELETED } }, { new: true });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        return group;
    }
};
exports.PanelsService = PanelsService;
exports.PanelsService = PanelsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(panel_schema_1.Panel.name)),
    __param(1, (0, mongoose_2.InjectModel)(test_schema_1.Test.name)),
    __param(2, (0, mongoose_2.InjectModel)(group_schema_1.Group.name)),
    __metadata("design:paramtypes", [mongoose_1.Model,
        mongoose_1.Model,
        mongoose_1.Model])
], PanelsService);
//# sourceMappingURL=panels.service.js.map