import {
  ExpenseCategory,
  IncomeCategory,
} from './enums/account-transaction.enum';

/**
 * The four Tally ledgers the product requires: Pharmacy, Therapy, Reception,
 * and Purchase. Every ledger carries a Receipt (money in) and a Payment
 * (money out) voucher type — see TallyService for the voucher-type mapping.
 */
export enum TallyLedgerGroup {
  Pharmacy = 'Pharmacy',
  Therapy = 'Therapy',
  Reception = 'Reception',
  Purchase = 'Purchase',
}

/**
 * Maps an AccountTransaction category to one of the four Tally ledgers.
 * Categories outside these four (e.g. Lab income, Salary, Office Expense)
 * resolve to `undefined` and fall back to the connection's generic
 * sales/expense ledgers, preserving pre-existing export behaviour for
 * anything the product rule does not call out.
 */
export function ledgerGroupForCategory(
  category: string | undefined | null,
): TallyLedgerGroup | undefined {
  switch (category) {
    case IncomeCategory.MedicineSale:
    case ExpenseCategory.SalesReturn:
      return TallyLedgerGroup.Pharmacy;

    case IncomeCategory.TherapyIncome:
    case IncomeCategory.ProcedureIncome:
    case ExpenseCategory.TherapyRefund:
      return TallyLedgerGroup.Therapy;

    case IncomeCategory.ConsultationFee:
    case ExpenseCategory.Refund:
      return TallyLedgerGroup.Reception;

    case ExpenseCategory.PurchasePayment:
      return TallyLedgerGroup.Purchase;

    default:
      return undefined;
  }
}
