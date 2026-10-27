export enum TransactionType {
  Income = 'Income',
  Expense = 'Expense',
}

export enum ExpenseCategory {
  Parking = 'Parking',
  DoctorExpense = 'Doctor Expense',
  Transportation = 'Transportation',
  Salary = 'Salary',
  Electricity = 'Electricity',
  Rent = 'Rent',
  OfficeExpense = 'Office Expense',
  Internet = 'Internet',
  Maintenance = 'Maintenance',
  /** Reception ledger payment: appointment refunds, including the separate NCF refund bill. */
  Refund = 'Refund',
  /** Pharmacy ledger payment: medicine returns. */
  SalesReturn = 'Sales Return',
  /** Therapy ledger payment: procedure/therapy fee refunds. */
  TherapyRefund = 'Therapy Refund',
  /** Purchase ledger payment: Cash/Card/UPI actually paid to a supplier. */
  PurchasePayment = 'Purchase Payment',
  PaymentCorrection = 'Payment Correction',
  Miscellaneous = 'Miscellaneous',
  OtherExpense = 'Other Expense',
}

export enum IncomeCategory {
  MedicineSale = 'Medicine Sale',
  ConsultationFee = 'Consultation Fee',
  LaboratoryIncome = 'Laboratory Income',
  TherapyIncome = 'Therapy Income',
  ProcedureIncome = 'Procedure Income',
  PaymentCorrection = 'Payment Correction',
  OtherIncome = 'Other Income',
}

export enum PaymentMethod {
  Cash = 'Cash',
  Card = 'Card',
  UPI = 'UPI',
}

export enum SourceModule {
  Uncategorised = 'Uncategorised',
  Doctor = 'Doctor',
  Pharmacy = 'Pharmacy',
  Lab = 'Lab',
  Reception = 'Reception',
  Purchase = 'Purchase',
}
