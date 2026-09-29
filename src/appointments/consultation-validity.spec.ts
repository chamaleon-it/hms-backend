import {
  addCalendarDays,
  clinicDayKey,
  CONSULTATION_VALIDITY_DAYS,
  displayValidUntil,
  resolveConsultationCharge,
} from './consultation-validity';

function atClinicMorning(year: number, month: number, day: number): Date {
  // 10:00 IST, stored as an ISO instant the way reception books appointments.
  return new Date(Date.UTC(year, month - 1, day, 4, 30, 0, 0));
}

describe('consultation validity window', () => {
  const windowDays = CONSULTATION_VALIDITY_DAYS;

  it('1. a paid visit on the 15th charges and Valid Upto is the 25th', () => {
    const result = resolveConsultationCharge({
      visitDate: atClinicMorning(2026, 9, 15),
      currentValidUntil: null,
      windowDays,
    });

    expect(result.charge).toBe(true);
    expect(clinicDayKey(result.validUntil)).toBe('2026-09-25');
  });

  it('2. a visit on the 20th while Valid Upto is the 25th does not charge or move the end date', () => {
    const paid = resolveConsultationCharge({
      visitDate: atClinicMorning(2026, 9, 15),
      currentValidUntil: null,
      windowDays,
    });
    const revisit = resolveConsultationCharge({
      visitDate: atClinicMorning(2026, 9, 20),
      currentValidUntil: paid.validUntil,
      windowDays,
    });

    expect(revisit.charge).toBe(false);
    expect(clinicDayKey(revisit.validUntil)).toBe('2026-09-25');
  });

  it('3. a visit on the Valid Upto date is still inside the window', () => {
    const paid = resolveConsultationCharge({
      visitDate: atClinicMorning(2026, 9, 15),
      currentValidUntil: null,
      windowDays,
    });
    const revisit = resolveConsultationCharge({
      visitDate: atClinicMorning(2026, 9, 25),
      currentValidUntil: paid.validUntil,
      windowDays,
    });

    expect(revisit.charge).toBe(false);
    expect(clinicDayKey(revisit.validUntil)).toBe('2026-09-25');
  });

  it('4. a visit on the 30th after the window charges, and the new end date follows the calendar', () => {
    const paid = resolveConsultationCharge({
      visitDate: atClinicMorning(2026, 9, 15),
      currentValidUntil: null,
      windowDays,
    });
    const september = resolveConsultationCharge({
      visitDate: atClinicMorning(2026, 9, 30),
      currentValidUntil: paid.validUntil,
      windowDays,
    });
    const october = resolveConsultationCharge({
      visitDate: atClinicMorning(2026, 10, 30),
      currentValidUntil: null,
      windowDays,
    });

    expect(september.charge).toBe(true);
    expect(clinicDayKey(september.validUntil)).toBe('2026-10-10');
    expect(october.charge).toBe(true);
    expect(clinicDayKey(october.validUntil)).toBe('2026-11-09');
    expect(clinicDayKey(addCalendarDays(atClinicMorning(2026, 9, 30), 10))).toBe(
      '2026-10-10',
    );
    expect(clinicDayKey(addCalendarDays(atClinicMorning(2026, 10, 30), 10))).toBe(
      '2026-11-09',
    );
  });

  it('5. paid 25/09/2026 is Valid Upto 05/10/2026; the 29/09 revisit keeps that date and does not charge', () => {
    const paid = resolveConsultationCharge({
      visitDate: atClinicMorning(2026, 9, 25),
      currentValidUntil: null,
      windowDays,
    });
    const revisit = resolveConsultationCharge({
      visitDate: atClinicMorning(2026, 9, 29),
      currentValidUntil: paid.validUntil,
      windowDays,
    });

    expect(paid.charge).toBe(true);
    expect(clinicDayKey(paid.validUntil)).toBe('2026-10-05');
    expect(revisit.charge).toBe(false);
    expect(clinicDayKey(revisit.validUntil)).toBe('2026-10-05');
    expect(clinicDayKey(revisit.validUntil)).not.toBe('2026-10-09');
  });

  it('a legacy free revisit with no stored end date still shows the paid window', () => {
    const shown = displayValidUntil({
      visitDate: atClinicMorning(2026, 9, 29),
      hasConsultationFee: false,
      consultationValidUntil: null,
      priorValidUntil: addCalendarDays(atClinicMorning(2026, 9, 25), windowDays),
      windowDays,
    });

    expect(clinicDayKey(shown)).toBe('2026-10-05');
  });
});
