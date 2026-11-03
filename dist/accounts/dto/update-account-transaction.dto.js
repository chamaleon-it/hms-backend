"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAccountTransactionDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_account_transaction_dto_1 = require("./create-account-transaction.dto");
class UpdateAccountTransactionDto extends (0, mapped_types_1.PartialType)(create_account_transaction_dto_1.CreateAccountTransactionDto) {
}
exports.UpdateAccountTransactionDto = UpdateAccountTransactionDto;
//# sourceMappingURL=update-account-transaction.dto.js.map