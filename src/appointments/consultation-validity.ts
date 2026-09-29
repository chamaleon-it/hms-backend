/**
 * Consultation validity for the reception registration bill.
 *
 * A paid visit opens a window of CONSULTATION_VALIDITY_DAYS calendar days.
 * No hospital setting stores that length, so it stays 10. A later visit on or
 * before that end date is free and must keep the same end date. The end date
 * is read from the previous visit, including a free revisit. It is not
 * recomputed from the visit being booked. The next paid visit, the first one
 * after the window, starts a new window from its own date.
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

export type VisitWindowRef = {
  id?: string;
  date: Date;
  hasConsultationFee?: boolean;
  consultationValidUntil?: Date | null;
};

function normalizeClinicDate(date: Date): Date {
  return clinicDate(...clinicPartsTuple(date));
}

function rawWindowEnd(visit: VisitWindowRef, windowDays: number): Date | null {
  if (visit.consultationValidUntil) {
    const stored = new Date(visit.consultationValidUntil);
    if (!Number.isNaN(stored.getTime())) return stored;
  }
  const when = new Date(visit.date);
  if (Number.isNaN(when.getTime())) return null;
  return addCalendarDays(when, windowDays);
}

/**
 * A free revisit that stored (or, on an old bill, printed) its own date plus
 * the window did not open a new window. That date is only a fallback when
 * no earlier visit has a real end date.
 */
function isUnpaidOwnPlusTen(
  visit: VisitWindowRef,
  end: Date,
  windowDays: number,
): boolean {
  if (visit.hasConsultationFee !== false) return false;
  const when = new Date(visit.date);
  if (Number.isNaN(when.getTime())) return false;
  return clinicDayKey(end) === clinicDayKey(addCalendarDays(when, windowDays));
}

/**
 * Valid Upto still open for a new visit.
 * The previous visit carries it, including a free revisit. A date that is
 * only the current visit plus 10 days is not read back from here.
 */
export function openConsultationWindow(
  priors: VisitWindowRef[],
  visitDate: Date,
  visitId?: string,
  windowDays: number = CONSULTATION_VALIDITY_DAYS,
): Date | null {
  const visitKey = clinicDayKey(visitDate);
  const ordered = priors
    .filter((visit) => {
      if (visitId && visit.id && String(visit.id) === String(visitId)) {
        return false;
      }
      const when = new Date(visit.date);
      if (Number.isNaN(when.getTime())) return false;
      return clinicDayKey(when) <= visitKey;
    })
    .sort((a, b) => {
      const delta = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (delta) return delta;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });

  let oldestCoveringSlide: Date | null = null;
  for (const prior of ordered) {
    const end = rawWindowEnd(prior, windowDays);
    if (!end) continue;
    const covers = isOnOrBeforeClinicDay(visitDate, end);
    const slide = isUnpaidOwnPlusTen(prior, end, windowDays);
    if (!slide) {
      if (covers) return normalizeClinicDate(end);
      // A real window has ended. Keep a later free bill's date only when
      // that bill already showed a Valid Upto this visit is still inside.
      return oldestCoveringSlide;
    }
    if (!covers) return null;
    oldestCoveringSlide = normalizeClinicDate(end);
  }
  return oldestCoveringSlide;
}

/**
 * Fee and Valid Upto for a visit.
 * Inside an open window the visit is free and the end date stays. The first
 * visit outside it is charged and opens a new window from its own date.
 */
export function resolveVisitValidity(input: {
  visitDate: Date;
  visitId?: string;
  priors?: VisitWindowRef[];
  windowDays?: number;
}): ConsultationCharge {
  const windowDays = input.windowDays ?? CONSULTATION_VALIDITY_DAYS;
  const open = openConsultationWindow(
    input.priors ?? [],
    input.visitDate,
    input.visitId,
    windowDays,
  );
  if (open) {
    return { charge: false, validUntil: open };
  }
  return {
    charge: true,
    validUntil: addCalendarDays(input.visitDate, windowDays),
  };
}

/**
 * Valid Upto to print and to keep on the visit.
 * A charged visit opens its own window. A free visit keeps the prior end date.
 * A stored date that is only this unpaid visit plus 10 days is not that window.
 */
export function displayValidUntil(input: {
  visitDate: Date;
  hasConsultationFee: boolean;
  consultationValidUntil?: Date | null;
  priorValidUntil?: Date | null;
  windowDays?: number;
}): Date {
  const windowDays = input.windowDays ?? CONSULTATION_VALIDITY_DAYS;
  const stored = input.consultationValidUntil
    ? new Date(input.consultationValidUntil)
    : null;
  const storedOk = !!stored && !Number.isNaN(stored.getTime());
  const slid =
    storedOk &&
    !input.hasConsultationFee &&
    clinicDayKey(stored as Date) ===
      clinicDayKey(addCalendarDays(input.visitDate, windowDays));

  if (storedOk && !slid) {
    return normalizeClinicDate(stored as Date);
  }
  if (input.priorValidUntil) {
    return normalizeClinicDate(new Date(input.priorValidUntil));
  }
  if (input.hasConsultationFee) {
    return addCalendarDays(input.visitDate, windowDays);
  }
  return addCalendarDays(input.visitDate, windowDays);
}
