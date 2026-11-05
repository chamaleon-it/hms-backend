"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TallyLedgerGroup = void 0;
exports.isSeparateNcfPayment = isSeparateNcfPayment;
exports.therapyCostCentre = therapyCostCentre;
exports.ledgerGroupForCategory = ledgerGroupForCategory;
const account_transaction_enum_1 = require("./enums/account-transaction.enum");
var TallyLedgerGroup;
(function (TallyLedgerGroup) {
    TallyLedgerGroup["Pharmacy"] = "Pharmacy";
    TallyLedgerGroup["Therapy"] = "Therapy";
    TallyLedgerGroup["Reception"] = "Reception";
    TallyLedgerGroup["Purchase"] = "Purchase";
})(TallyLedgerGroup || (exports.TallyLedgerGroup = TallyLedgerGroup = {}));
function isSeparateNcfPayment(bill) {
    if (String(bill.transactionType || '') !== 'Refund')
        return false;
    return (String(bill.note || '')
        .trim()
        .toLowerCase() === 'ncf');
}
function therapyCostCentre(therapistName, category, ledgerGroup) {
    const group = ledgerGroup || ledgerGroupForCategory(category);
    if (group !== TallyLedgerGroup.Therapy)
        return undefined;
    const name = String(therapistName || '').trim();
    if (!name || name === '-')
        return undefined;
    return name;
}
function ledgerGroupForCategory(category) {
    switch (category) {
        case account_transaction_enum_1.IncomeCategory.MedicineSale:
        case account_transaction_enum_1.ExpenseCategory.SalesReturn:
            return TallyLedgerGroup.Pharmacy;
        case account_transaction_enum_1.IncomeCategory.TherapyIncome:
        case account_transaction_enum_1.IncomeCategory.ProcedureIncome:
        case account_transaction_enum_1.ExpenseCategory.TherapyRefund:
            return TallyLedgerGroup.Therapy;
        case account_transaction_enum_1.IncomeCategory.ConsultationFee:
        case account_transaction_enum_1.ExpenseCategory.Refund:
            return TallyLedgerGroup.Reception;
        case account_transaction_enum_1.ExpenseCategory.PurchasePayment:
            return TallyLedgerGroup.Purchase;
        default:
            return undefined;
    }
}
//# sourceMappingURL=ledger-group.js.map