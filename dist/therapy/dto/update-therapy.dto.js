"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTherapyDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_therapy_dto_1 = require("./create-therapy.dto");
class UpdateTherapyDto extends (0, mapped_types_1.PartialType)(create_therapy_dto_1.CreateTherapyDto) {
}
exports.UpdateTherapyDto = UpdateTherapyDto;
//# sourceMappingURL=update-therapy.dto.js.map