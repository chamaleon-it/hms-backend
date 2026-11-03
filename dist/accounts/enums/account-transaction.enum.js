"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceModule = exports.PaymentMethod = exports.IncomeCategory = exports.ExpenseCategory = exports.TransactionType = void 0;
var TransactionType;
(function (TransactionType) {
    TransactionType["Income"] = "Income";
    TransactionType["Expense"] = "Expense";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var ExpenseCategory;
(function (ExpenseCategory) {
    ExpenseCategory["Parking"] = "Parking";
    ExpenseCategory["DoctorExpense"] = "Doctor Expense";
    ExpenseCategory["Transportation"] = "Transportation";
    ExpenseCategory["Salary"] = "Salary";
    ExpenseCategory["Electricity"] = "Electricity";
    ExpenseCategory["Rent"] = "Rent";
    ExpenseCategory["OfficeExpense"] = "Office Expense";
    ExpenseCategory["Internet"] = "Internet";
    ExpenseCategory["Maintenance"] = "Maintenance";
    ExpenseCategory["Refund"] = "Refund";
    ExpenseCategory["SalesReturn"] = "Sales Return";
    ExpenseCategory["TherapyRefund"] = "Therapy Refund";
    ExpenseCategory["PurchasePayment"] = "Purchase Payment";
    ExpenseCategory["PaymentCorrection"] = "Payment Correction";
    ExpenseCategory["Miscellaneous"] = "Miscellaneous";
    ExpenseCategory["OtherExpense"] = "Other Expense";
})(ExpenseCategory || (exports.ExpenseCategory = ExpenseCategory = {}));
var IncomeCategory;
(function (IncomeCategory) {
    IncomeCategory["MedicineSale"] = "Medicine Sale";
    IncomeCategory["ConsultationFee"] = "Consultation Fee";
    IncomeCategory["LaboratoryIncome"] = "Laboratory Income";
    IncomeCategory["TherapyIncome"] = "Therapy Income";
    IncomeCategory["ProcedureIncome"] = "Procedure Income";
    IncomeCategory["PaymentCorrection"] = "Payment Correction";
    IncomeCategory["OtherIncome"] = "Other Income";
})(IncomeCategory || (exports.IncomeCategory = IncomeCategory = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["Cash"] = "Cash";
    PaymentMethod["Card"] = "Card";
    PaymentMethod["UPI"] = "UPI";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var SourceModule;
(function (SourceModule) {
    SourceModule["Uncategorised"] = "Uncategorised";
    SourceModule["Doctor"] = "Doctor";
    SourceModule["Pharmacy"] = "Pharmacy";
    SourceModule["Lab"] = "Lab";
    SourceModule["Reception"] = "Reception";
    SourceModule["Purchase"] = "Purchase";
})(SourceModule || (exports.SourceModule = SourceModule = {}));
//# sourceMappingURL=account-transaction.enum.js.map