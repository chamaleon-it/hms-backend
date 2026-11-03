"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBillingItemDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const add_billing_item_dto_1 = require("./add-billing-item.dto");
class UpdateBillingItemDto extends (0, mapped_types_1.PartialType)(add_billing_item_dto_1.AddBillingItemDto) {
}
exports.UpdateBillingItemDto = UpdateBillingItemDto;
//# sourceMappingURL=update-billing-item.dto.js.map