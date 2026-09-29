/**
 * Consultation validity for the reception registration bill.
 *
 * A paid visit opens a window of CONSULTATION_VALIDITY_DAYS calendar days.
 * No hospital setting stores that length, so it stays 10. A later visit on or
 * before the stored end date is free and must keep that end date. The next
 * paid visit, the first one after the window, starts a new window from its
 * own date.
 *
 * Dates are the clinic calendar (Asia/Kolkata), not the server's local
 * day-of-month. Adding days goes through Date.UTC so 30 Sep + 10 is 10 Oct
 * and 30 Oct + 10 is 9 Nov.
 */

export const CONSULTATION_VALIDITY_DAYS = 10;

const CLINIC_TIME_ZONE = 'Asia/Kolkata';

export type ClinicCalendarParts = {
  year: number;
  month: number;
  day: number;
};

export function clinicCalendarParts(date: Date): ClinicCalendarParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
  };
}

/** Noon UTC on the clinic calendar day, so a local format still shows that day. */
export function clinicDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

export function clinicDayKey(date: Date): string {
  const { year, month, day } = clinicCalendarParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function addCalendarDays(date: Date, days: number): Date {
  const { year, month, day } = clinicCalendarParts(date);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return clinicDate(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
  );
}

export function isOnOrBeforeClinicDay(visit: Date, validUntil: Date): boolean {
  return clinicDayKey(visit) <= clinicDayKey(validUntil);
}

export type ConsultationCharge = {
  charge: boolean;
  validUntil: Date;
};

/**
 * Decide the consultation fee and the Valid Upto date for a visit.
 * `currentValidUntil` is the inclusive end date opened by the last paid visit.
 */
export function resolveConsultationCharge(input: {
  visitDate: Date;
  currentValidUntil: Date | null;
  windowDays?: number;
}): ConsultationCharge {
  const windowDays = input.windowDays ?? CONSULTATION_VALIDITY_DAYS;
  if (
    input.currentValidUntil &&
    isOnOrBeforeClinicDay(input.visitDate, input.currentValidUntil)
  ) {
    return {
      charge: false,
      validUntil: clinicDate(
        ...clinicPartsTuple(input.currentValidUntil),
      ),
    };
  }
  return {
    charge: true,
    validUntil: addCalendarDays(input.visitDate, windowDays),
  };
}

function clinicPartsTuple(date: Date): [number, number, number] {
  const parts = clinicCalendarParts(date);
  return [parts.year, parts.month, parts.day];
}

export type ChargedVisitRef = {
  id?: string;
  date: Date;
  consultationValidUntil?: Date | null;
};

/** Latest paid visit on or before this visit, excluding the visit itself. */
export function priorConsultationValidUntil(
  chargedVisits: ChargedVisitRef[],
  visitDate: Date,
  visitId: string | undefined,
  windowDays: number = CONSULTATION_VALIDITY_DAYS,
): Date | null {
  const visitKey = clinicDayKey(visitDate);
  const prior = chargedVisits
    .filter((visit) => {
      if (visitId && visit.id && visit.id === visitId) return false;
      return clinicDayKey(visit.date) <= visitKey;
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  if (!prior) return null;
  if (prior.consultationValidUntil) {
    return new Date(prior.consultationValidUntil);
  }
  return addCalendarDays(prior.date, windowDays);
}

/**
 * Valid Upto to print and to keep on the visit.
 * A charged visit opens its own window. A free visit keeps the prior end date.
 */
export function displayValidUntil(input: {
  visitDate: Date;
  hasConsultationFee: boolean;
  consultationValidUntil?: Date | null;
  priorValidUntil?: Date | null;
  windowDays?: number;
}): Date {
  if (input.consultationValidUntil) {
    return clinicDate(...clinicPartsTuple(input.consultationValidUntil));
  }
  const windowDays = input.windowDays ?? CONSULTATION_VALIDITY_DAYS;
  if (input.hasConsultationFee) {
    return addCalendarDays(input.visitDate, windowDays);
  }
  if (
    input.priorValidUntil &&
    isOnOrBeforeClinicDay(input.visitDate, input.priorValidUntil)
  ) {
    return clinicDate(...clinicPartsTuple(input.priorValidUntil));
  }
  if (input.priorValidUntil) {
    return clinicDate(...clinicPartsTuple(input.priorValidUntil));
  }
  return addCalendarDays(input.visitDate, windowDays);
}
