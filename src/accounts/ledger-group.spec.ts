import {
  isSeparateNcfPayment,
  ledgerGroupForCategory,
  TallyLedgerGroup,
} from './ledger-group';
import {
  ExpenseCategory,
  IncomeCategory,
} from './enums/account-transaction.enum';

describe('ledgerGroupForCategory', () => {
  it('routes pharmacy medicine sales and returns to the Pharmacy ledger', () => {
    expect(ledgerGroupForCategory(IncomeCategory.MedicineSale)).toBe(
      TallyLedgerGroup.Pharmacy,
    );
    expect(ledgerGroupForCategory(ExpenseCategory.SalesReturn)).toBe(
      TallyLedgerGroup.Pharmacy,
    );
  });

  it('routes therapy and procedure income/refunds to the Therapy ledger', () => {
    expect(ledgerGroupForCategory(IncomeCategory.TherapyIncome)).toBe(
      TallyLedgerGroup.Therapy,
    );
    expect(ledgerGroupForCategory(IncomeCategory.ProcedureIncome)).toBe(
      TallyLedgerGroup.Therapy,
    );
    expect(ledgerGroupForCategory(ExpenseCategory.TherapyRefund)).toBe(
      TallyLedgerGroup.Therapy,
    );
  });

  it('routes consultation fee collection to the Reception receipt side and refunds to the payment side', () => {
    expect(ledgerGroupForCategory(IncomeCategory.ConsultationFee)).toBe(
      TallyLedgerGroup.Reception,
    );
    expect(ledgerGroupForCategory(ExpenseCategory.Refund)).toBe(
      TallyLedgerGroup.Reception,
    );
  });

  it('routes supplier payments to the Purchase ledger', () => {
    expect(ledgerGroupForCategory(ExpenseCategory.PurchasePayment)).toBe(
      TallyLedgerGroup.Purchase,
    );
  });

  it('falls back to the generic ledger for anything outside the four product ledgers', () => {
    expect(
      ledgerGroupForCategory(IncomeCategory.LaboratoryIncome),
    ).toBeUndefined();
    expect(ledgerGroupForCategory(ExpenseCategory.Salary)).toBeUndefined();
    expect(
      ledgerGroupForCategory(ExpenseCategory.PaymentCorrection),
    ).toBeUndefined();
    expect(ledgerGroupForCategory(undefined)).toBeUndefined();
  });
});

describe('isSeparateNcfPayment', () => {
  it('matches the separate Mark as NCF refund bill', () => {
    expect(
      isSeparateNcfPayment({ transactionType: 'Refund', note: 'NCF' }),
    ).toBe(true);
    expect(
      isSeparateNcfPayment({ transactionType: 'Refund', note: ' ncf ' }),
    ).toBe(true);
  });

  it('does not treat consultation fee collection, or other refund reasons, as NCF', () => {
    expect(isSeparateNcfPayment({ transactionType: 'Sale', note: 'NCF' })).toBe(
      false,
    );
    expect(isSeparateNcfPayment({ note: undefined })).toBe(false);
    expect(
      isSeparateNcfPayment({
        transactionType: 'Refund',
        note: 'Doctor Unavailable',
      }),
    ).toBe(false);
    expect(
      isSeparateNcfPayment({
        transactionType: undefined,
        note: 'Consultation Fee',
      }),
    ).toBe(false);
  });
});
