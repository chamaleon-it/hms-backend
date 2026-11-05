"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSupplierDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const register_supplier_dto_1 = require("./register-supplier.dto");
class UpdateSupplierDto extends (0, mapped_types_1.PartialType)(register_supplier_dto_1.RegisterSupplierDto) {
}
exports.UpdateSupplierDto = UpdateSupplierDto;
//# sourceMappingURL=update-suppllier.dto.js.map