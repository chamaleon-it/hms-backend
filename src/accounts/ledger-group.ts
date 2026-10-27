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
 * Reception's "Mark as NCF" action stores a separate refund bill
 * (`POST /appointments/refund` with reason `"NCF"`). That bill's note is
 * the reason and its transaction type is Refund. It is money going out.
 * It is not a line on the consultation-fee bill, and a consultation-fee
 * sale (money collected at booking) is not this record.
 */
export function isSeparateNcfPayment(bill: {
  transactionType?: string | null;
  note?: string | null;
}): boolean {
  if (String(bill.transactionType || '') !== 'Refund') return false;
  return (
    String(bill.note || '')
      .trim()
      .toLowerCase() === 'ncf'
  );
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
