"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBillingDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_billing_dto_1 = require("./create-billing.dto");
class UpdateBillingDto extends (0, mapped_types_1.PartialType)(create_billing_dto_1.CreateBillingDto) {
}
exports.UpdateBillingDto = UpdateBillingDto;
//# sourceMappingURL=update-billing.dto.js.map