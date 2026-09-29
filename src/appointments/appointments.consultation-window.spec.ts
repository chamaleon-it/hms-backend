import { Types } from 'mongoose';
import { AppointmentsService } from './appointments.service';
import { clinicDayKey } from './consultation-validity';

function atClinicMorning(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 4, 30, 0, 0));
}

describe('stored registration-bill validity', () => {
  const patientId = new Types.ObjectId();
  const doctorId = new Types.ObjectId();
  const userId = new Types.ObjectId();
  const appointments: any[] = [];
  const bills: any[] = [];

  const appointmentModel = {
    findOne: jest.fn((query: any) => ({
      sort: () => {
        if (query && Object.prototype.hasOwnProperty.call(query, 'hasConsultationFee')) {
          const matches = appointments.filter(
            (appointment) =>
              String(appointment.patient) === String(query.patient) &&
              String(appointment.doctor) === String(query.doctor) &&
              appointment.hasConsultationFee !== false &&
              appointment.isRefunded !== true &&
              appointment.isDeleted !== true,
          );
          matches.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );
          return Promise.resolve(matches[0] ?? null);
        }
        return Promise.resolve(null);
      },
    })),
    countDocuments: jest.fn().mockResolvedValue(0),
    find: jest.fn(() => ({
      select() {
        return this;
      },
      lean() {
        return Promise.resolve(
          appointments.filter(
            (appointment) =>
              appointment.isDeleted !== true && appointment.isRefunded !== true,
          ),
        );
      },
    })),
    create: jest.fn(async (doc: any) => {
      const saved = { ...doc, _id: new Types.ObjectId() };
      appointments.push(saved);
      return saved;
    }),
  };

  const usersService = {
    getUserById: jest.fn().mockResolvedValue({
      name: 'Umer Mukhthar',
      consultationFee: 200,
    }),
  };

  const billingService = {
    generateBill: jest.fn(async (bill: any) => {
      bills.push(bill);
      return bill;
    }),
  };

  const service = new AppointmentsService(
    appointmentModel as any,
    {} as any,
    usersService as any,
    billingService as any,
  );

  async function book(date: Date, patient = patientId) {
    bills.length = 0;
    const created = await service.createAppointment(
      {
        patient,
        doctor: doctorId,
        date,
      } as any,
      userId as any,
    );
    return created as any;
  }

  it('keeps one window across the acceptance visits and stores it on each appointment', async () => {
    const paidOn15 = await book(atClinicMorning(2026, 9, 15));
    expect(paidOn15.hasConsultationFee).toBe(true);
    expect(clinicDayKey(paidOn15.consultationValidUntil)).toBe('2026-09-25');
    expect(bills).toHaveLength(1);
    expect(bills[0].items[0].total).toBe(200);
    expect(bills[0].items[0].name).toBe('Consultation Fee');

    const on20 = await book(atClinicMorning(2026, 9, 20));
    expect(on20.hasConsultationFee).toBe(false);
    expect(clinicDayKey(on20.consultationValidUntil)).toBe('2026-09-25');
    expect(bills).toHaveLength(0);

    const on25 = await book(atClinicMorning(2026, 9, 25));
    expect(on25.hasConsultationFee).toBe(false);
    expect(clinicDayKey(on25.consultationValidUntil)).toBe('2026-09-25');
    expect(bills).toHaveLength(0);

    const on30Sep = await book(atClinicMorning(2026, 9, 30));
    expect(on30Sep.hasConsultationFee).toBe(true);
    expect(clinicDayKey(on30Sep.consultationValidUntil)).toBe('2026-10-10');
    expect(bills).toHaveLength(1);
    expect(bills[0].items[0].total).toBe(200);

    const on30Oct = await book(atClinicMorning(2026, 10, 30));
    expect(on30Oct.hasConsultationFee).toBe(true);
    expect(clinicDayKey(on30Oct.consultationValidUntil)).toBe('2026-11-09');
    expect(bills).toHaveLength(1);
  });

  it('stores 05/10/2026 after a paid 25/09 visit and keeps it on the 29/09 free revisit', async () => {
    const patient = new Types.ObjectId();

    const paid = await book(atClinicMorning(2026, 9, 25), patient);
    expect(paid.hasConsultationFee).toBe(true);
    expect(clinicDayKey(paid.consultationValidUntil)).toBe('2026-10-05');
    expect(bills[0].items[0].total).toBe(200);

    const revisit = await book(atClinicMorning(2026, 9, 29), patient);
    expect(revisit.hasConsultationFee).toBe(false);
    expect(clinicDayKey(revisit.consultationValidUntil)).toBe('2026-10-05');
    expect(clinicDayKey(revisit.consultationValidUntil)).not.toBe('2026-10-09');
    expect(bills).toHaveLength(0);
  });

  it('keeps stored 09/10/2026 on the 01/10 free revisit instead of 01/10 + 10 days', async () => {
    const patient = new Types.ObjectId();
    appointments.push({
      _id: new Types.ObjectId(),
      patient,
      doctor: doctorId,
      date: atClinicMorning(2026, 9, 29),
      hasConsultationFee: false,
      consultationValidUntil: new Date(Date.UTC(2026, 9, 9, 12, 0, 0, 0)),
      isDeleted: false,
      isRefunded: false,
    });

    const revisit = await book(atClinicMorning(2026, 10, 1), patient);
    expect(revisit.hasConsultationFee).toBe(false);
    expect(clinicDayKey(revisit.consultationValidUntil)).toBe('2026-10-09');
    expect(clinicDayKey(revisit.consultationValidUntil)).not.toBe('2026-10-11');
    expect(bills).toHaveLength(0);
  });

  it('charges 13/01/2026 after a window that ended 11/01/2026 and sets 23/01', async () => {
    const patient = new Types.ObjectId();

    const paid = await book(atClinicMorning(2026, 1, 1), patient);
    expect(paid.hasConsultationFee).toBe(true);
    expect(clinicDayKey(paid.consultationValidUntil)).toBe('2026-01-11');

    const inside = await book(atClinicMorning(2026, 1, 5), patient);
    expect(inside.hasConsultationFee).toBe(false);
    expect(clinicDayKey(inside.consultationValidUntil)).toBe('2026-01-11');

    const onEnd = await book(atClinicMorning(2026, 1, 11), patient);
    expect(onEnd.hasConsultationFee).toBe(false);
    expect(clinicDayKey(onEnd.consultationValidUntil)).toBe('2026-01-11');

    const after = await book(atClinicMorning(2026, 1, 13), patient);
    expect(after.hasConsultationFee).toBe(true);
    expect(clinicDayKey(after.consultationValidUntil)).toBe('2026-01-23');
    expect(bills[0].items[0].total).toBe(200);
  });
});
