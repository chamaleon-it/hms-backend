"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InPatientsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const in_patients_service_1 = require("./in-patients.service");
const in_patients_controller_1 = require("./in-patients.controller");
const in_patient_schema_1 = require("./schemas/in-patient.schema");
const patient_schema_1 = require("../patients/schemas/patient.schema");
let InPatientsModule = class InPatientsModule {
};
exports.InPatientsModule = InPatientsModule;
exports.InPatientsModule = InPatientsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: in_patient_schema_1.InPatient.name, schema: in_patient_schema_1.InPatientSchema },
                { name: patient_schema_1.Patient.name, schema: patient_schema_1.PatientSchema },
            ]),
        ],
        controllers: [in_patients_controller_1.InPatientsController],
        providers: [in_patients_service_1.InPatientsService],
        exports: [in_patients_service_1.InPatientsService],
    })
], InPatientsModule);
//# sourceMappingURL=in-patients.module.js.map