import {
  clampOrderDiscount,
  clampPaymentSplit,
  positiveMoney,
  roundMoney,
  splitTotal,
} from '../pharmacy/sale-line';

export interface AppointmentPaymentInput {
  cash?: unknown;
  card?: unknown;
  upi?: unknown;
  discount?: unknown;
}

export interface AppointmentPayment {
  cash: number;
  card: number;
  upi: number;
  discount: number;
  /** Cash + card + UPI. */
  paid: number;
  /** Consultation fee after discount. */
  payable: number;
  /** True when the fee is known and paid + discount covers it. */
  settled: boolean;
}

/**
 * Money collected when booking a visit. Same rule as the pharmacy order: the
 * discount never exceeds the consultation fee, and cash + card + UPI never
 * exceed the fee after discount. Empty fields count as zero. With no fee
 * configured there is nothing to cap against, so the entered split is kept
 * and the discount is zero.
 */
export function resolveAppointmentPayment(
  input: AppointmentPaymentInput | null | undefined,
  consultationFee: unknown,
): AppointmentPayment {
  const fee = roundMoney(positiveMoney(consultationFee));

  if (fee <= 0) {
    const split = {
      cash: roundMoney(positiveMoney(input?.cash)),
      card: roundMoney(positiveMoney(input?.card)),
      upi: roundMoney(positiveMoney(input?.upi)),
    };
    return {
      ...split,
      discount: 0,
      paid: splitTotal(split),
      payable: 0,
      settled: false,
    };
  }

  const discount = clampOrderDiscount(input?.discount, fee);
  const payable = roundMoney(fee - discount);
  const split = clampPaymentSplit(input, payable);
  const paid = splitTotal(split);
  return {
    ...split,
    discount,
    paid,
    payable,
    settled: paid + 0.009 >= payable,
  };
}
