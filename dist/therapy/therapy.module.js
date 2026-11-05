"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TherapyModule = void 0;
const common_1 = require("@nestjs/common");
const therapy_service_1 = require("./therapy.service");
const therapy_controller_1 = require("./therapy.controller");
const mongoose_1 = require("@nestjs/mongoose");
const therapy_schema_1 = require("./schemas/therapy.schema");
let TherapyModule = class TherapyModule {
};
exports.TherapyModule = TherapyModule;
exports.TherapyModule = TherapyModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: therapy_schema_1.Therapy.name, schema: therapy_schema_1.TherapySchema }]),
        ],
        controllers: [therapy_controller_1.TherapyController],
        providers: [therapy_service_1.TherapyService],
        exports: [therapy_service_1.TherapyService],
    })
], TherapyModule);
//# sourceMappingURL=therapy.module.js.map