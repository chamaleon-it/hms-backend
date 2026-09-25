import 'reflect-metadata';
import { UpdateBillingDto } from './update-billing.dto';

describe('UpdateBillingDto mass-assignment harden', () => {
  it('exposes only safe patch fields (no user/patient/mrn/reportId/status)', () => {
    const sample = new UpdateBillingDto();
    sample.doctor = 'Dr X';
    sample.cash = 10;
    sample.online = 0;
    sample.discount = 0;
    sample.note = 'n';
    sample.items = [];

    expect(sample).toEqual(
      expect.objectContaining({
        doctor: 'Dr X',
        cash: 10,
        note: 'n',
      }),
    );
    expect(sample).not.toHaveProperty('user');
    expect(sample).not.toHaveProperty('patient');
    expect(sample).not.toHaveProperty('mrn');
    expect(sample).not.toHaveProperty('reportId');
    expect(sample).not.toHaveProperty('rxId');
    expect(sample).not.toHaveProperty('status');
  });
});
