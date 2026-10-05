import { resolveAppointmentPayment } from './appointment-payment';

describe('resolveAppointmentPayment', () => {
  it('treats empty fields as zero and leaves the bill unsettled', () => {
    expect(resolveAppointmentPayment({}, 500)).toEqual({
      cash: 0,
      card: 0,
      upi: 0,
      discount: 0,
      paid: 0,
      payable: 500,
      settled: false,
    });
  });

  it('keeps a split that covers the fee and marks it settled', () => {
    const payment = resolveAppointmentPayment(
      { cash: '200', card: 100, upi: 150, discount: 50 },
      500,
    );
    expect(payment).toEqual({
      cash: 200,
      card: 100,
      upi: 150,
      discount: 50,
      paid: 450,
      payable: 450,
      settled: true,
    });
  });

  it('caps the discount at the fee and the split at the fee after discount', () => {
    const payment = resolveAppointmentPayment(
      { cash: 400, card: 300, upi: 200, discount: 900 },
      500,
    );
    expect(payment.discount).toBe(500);
    expect(payment.payable).toBe(0);
    expect(payment).toMatchObject({ cash: 0, card: 0, upi: 0, paid: 0 });

    const partial = resolveAppointmentPayment(
      { cash: 400, card: 300, upi: 200, discount: 100 },
      500,
    );
    expect(partial).toMatchObject({
      cash: 400,
      card: 0,
      upi: 0,
      discount: 100,
      paid: 400,
      payable: 400,
      settled: true,
    });
  });

  it('ignores negative and non-numeric input', () => {
    expect(
      resolveAppointmentPayment(
        { cash: -10, card: 'abc', upi: null, discount: undefined },
        300,
      ),
    ).toMatchObject({ cash: 0, card: 0, upi: 0, discount: 0 });
  });

  it('keeps the entered split when the doctor has no fee configured', () => {
    expect(
      resolveAppointmentPayment({ cash: 100, upi: 50, discount: 20 }, 0),
    ).toEqual({
      cash: 100,
      card: 0,
      upi: 50,
      discount: 0,
      paid: 150,
      payable: 0,
      settled: false,
    });
  });
});
