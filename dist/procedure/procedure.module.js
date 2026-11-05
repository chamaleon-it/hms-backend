"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcedureModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const procedure_schema_1 = require("./schemas/procedure.schema");
const procedure_service_1 = require("./procedure.service");
const procedure_controller_1 = require("./procedure.controller");
let ProcedureModule = class ProcedureModule {
};
exports.ProcedureModule = ProcedureModule;
exports.ProcedureModule = ProcedureModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: procedure_schema_1.Procedure.name, schema: procedure_schema_1.ProcedureSchema },
            ]),
        ],
        controllers: [procedure_controller_1.ProcedureController],
        providers: [procedure_service_1.ProcedureService],
        exports: [procedure_service_1.ProcedureService, mongoose_1.MongooseModule],
    })
], ProcedureModule);
//# sourceMappingURL=procedure.module.js.map