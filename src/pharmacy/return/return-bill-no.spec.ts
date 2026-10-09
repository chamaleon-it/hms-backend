import { nextReturnBillNumber } from './return-bill-no';

describe('nextReturnBillNumber', () => {
  it('starts at R-00001 when nothing is stored', () => {
    expect(nextReturnBillNumber([])).toBe('R-00001');
  });

  it('issues a new number when the sale bill was already returned', () => {
    expect(nextReturnBillNumber(['R-00001', 'R-PH-18', 'PH-00018'])).toBe(
      'R-00002',
    );
  });

  it('skips a number that is already taken', () => {
    expect(nextReturnBillNumber(['R-00004', 'R-00001'])).toBe('R-00005');
  });
});
