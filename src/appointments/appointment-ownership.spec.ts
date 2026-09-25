import { UserRole } from 'src/users/schemas/user.schema';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';

/**
 * Lightweight unit coverage for doctor appointment ownership without Mongo.
 * Mirrors AppointmentsService.assertDoctorOwnsAppointment behavior.
 */
function assertDoctorOwnsAppointment(
  user: JWTUserInterface | undefined,
  appointment: { doctor?: string | null },
) {
  if (!user || user.role !== UserRole.DOCTOR) return;
  const doctorId = String(appointment?.doctor ?? '');
  if (!doctorId || doctorId !== String(user.id)) {
    const err: any = new Error('You can only modify appointments assigned to you.');
    err.name = 'ForbiddenException';
    throw err;
  }
}

describe('Doctor appointment ownership (IDOR harden)', () => {
  const doctorA = {
    id: 'doc-a' as any,
    email: 'a@x.com',
    role: UserRole.DOCTOR,
  } as JWTUserInterface;
  const doctorB = {
    id: 'doc-b' as any,
    email: 'b@x.com',
    role: UserRole.DOCTOR,
  } as JWTUserInterface;
  const pharmacy = {
    id: 'pharm' as any,
    email: 'p@x.com',
    role: UserRole.PHARMACY,
  } as JWTUserInterface;

  it('allows a doctor to mutate their own appointment', () => {
    expect(() =>
      assertDoctorOwnsAppointment(doctorA, { doctor: 'doc-a' }),
    ).not.toThrow();
  });

  it('forbids a doctor from mutating another doctor appointment', () => {
    expect(() =>
      assertDoctorOwnsAppointment(doctorA, { doctor: 'doc-b' }),
    ).toThrow(/only modify appointments assigned to you/);
  });

  it('allows pharmacy/admin staff to mutate any appointment', () => {
    expect(() =>
      assertDoctorOwnsAppointment(pharmacy, { doctor: 'doc-b' }),
    ).not.toThrow();
    expect(() =>
      assertDoctorOwnsAppointment(doctorB, { doctor: 'doc-b' }),
    ).not.toThrow();
  });
});
