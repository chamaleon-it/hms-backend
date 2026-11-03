"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProcedureDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_procedure_dto_1 = require("./create-procedure.dto");
class UpdateProcedureDto extends (0, mapped_types_1.PartialType)(create_procedure_dto_1.CreateProcedureDto) {
}
exports.UpdateProcedureDto = UpdateProcedureDto;
//# sourceMappingURL=update-procedure.dto.js.map