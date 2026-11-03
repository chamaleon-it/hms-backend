"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONSULTATION_VALIDITY_DAYS = void 0;
exports.clinicCalendarParts = clinicCalendarParts;
exports.clinicDate = clinicDate;
exports.clinicDayKey = clinicDayKey;
exports.addCalendarDays = addCalendarDays;
exports.isOnOrBeforeClinicDay = isOnOrBeforeClinicDay;
exports.resolveConsultationCharge = resolveConsultationCharge;
exports.priorConsultationValidUntil = priorConsultationValidUntil;
exports.openConsultationWindow = openConsultationWindow;
exports.resolveVisitValidity = resolveVisitValidity;
exports.displayValidUntil = displayValidUntil;
exports.CONSULTATION_VALIDITY_DAYS = 10;
const CLINIC_TIME_ZONE = 'Asia/Kolkata';
function clinicCalendarParts(date) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: CLINIC_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const read = (type) => Number(parts.find((part) => part.type === type)?.value);
    return {
        year: read('year'),
        month: read('month'),
        day: read('day'),
    };
}
function clinicDate(year, month, day) {
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}
function clinicDayKey(date) {
    const { year, month, day } = clinicCalendarParts(date);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function addCalendarDays(date, days) {
    const { year, month, day } = clinicCalendarParts(date);
    const shifted = new Date(Date.UTC(year, month - 1, day + days));
    return clinicDate(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}
function isOnOrBeforeClinicDay(visit, validUntil) {
    return clinicDayKey(visit) <= clinicDayKey(validUntil);
}
function resolveConsultationCharge(input) {
    const windowDays = input.windowDays ?? exports.CONSULTATION_VALIDITY_DAYS;
    if (input.currentValidUntil &&
        isOnOrBeforeClinicDay(input.visitDate, input.currentValidUntil)) {
        return {
            charge: false,
            validUntil: clinicDate(...clinicPartsTuple(input.currentValidUntil)),
        };
    }
    return {
        charge: true,
        validUntil: addCalendarDays(input.visitDate, windowDays),
    };
}
function clinicPartsTuple(date) {
    const parts = clinicCalendarParts(date);
    return [parts.year, parts.month, parts.day];
}
function priorConsultationValidUntil(chargedVisits, visitDate, visitId, windowDays = exports.CONSULTATION_VALIDITY_DAYS) {
    const visitKey = clinicDayKey(visitDate);
    const prior = chargedVisits
        .filter((visit) => {
        if (visitId && visit.id && visit.id === visitId)
            return false;
        return clinicDayKey(visit.date) <= visitKey;
    })
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    if (!prior)
        return null;
    if (prior.consultationValidUntil) {
        return new Date(prior.consultationValidUntil);
    }
    return addCalendarDays(prior.date, windowDays);
}
function normalizeClinicDate(date) {
    return clinicDate(...clinicPartsTuple(date));
}
function rawWindowEnd(visit, windowDays) {
    if (visit.consultationValidUntil) {
        const stored = new Date(visit.consultationValidUntil);
        if (!Number.isNaN(stored.getTime()))
            return stored;
    }
    const when = new Date(visit.date);
    if (Number.isNaN(when.getTime()))
        return null;
    return addCalendarDays(when, windowDays);
}
function isUnpaidOwnPlusTen(visit, end, windowDays) {
    if (visit.hasConsultationFee !== false)
        return false;
    const when = new Date(visit.date);
    if (Number.isNaN(when.getTime()))
        return false;
    return clinicDayKey(end) === clinicDayKey(addCalendarDays(when, windowDays));
}
function openConsultationWindow(priors, visitDate, visitId, windowDays = exports.CONSULTATION_VALIDITY_DAYS) {
    const visitKey = clinicDayKey(visitDate);
    const ordered = priors
        .filter((visit) => {
        if (visitId && visit.id && String(visit.id) === String(visitId)) {
            return false;
        }
        const when = new Date(visit.date);
        if (Number.isNaN(when.getTime()))
            return false;
        return clinicDayKey(when) <= visitKey;
    })
        .sort((a, b) => {
        const delta = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (delta)
            return delta;
        return String(b.id || '').localeCompare(String(a.id || ''));
    });
    let oldestCoveringSlide = null;
    for (const prior of ordered) {
        const end = rawWindowEnd(prior, windowDays);
        if (!end)
            continue;
        const covers = isOnOrBeforeClinicDay(visitDate, end);
        const slide = isUnpaidOwnPlusTen(prior, end, windowDays);
        if (!slide) {
            if (covers)
                return normalizeClinicDate(end);
            return oldestCoveringSlide;
        }
        if (!covers)
            return null;
        oldestCoveringSlide = normalizeClinicDate(end);
    }
    return oldestCoveringSlide;
}
function resolveVisitValidity(input) {
    const windowDays = input.windowDays ?? exports.CONSULTATION_VALIDITY_DAYS;
    const open = openConsultationWindow(input.priors ?? [], input.visitDate, input.visitId, windowDays);
    if (open) {
        return { charge: false, validUntil: open };
    }
    return {
        charge: true,
        validUntil: addCalendarDays(input.visitDate, windowDays),
    };
}
function displayValidUntil(input) {
    const windowDays = input.windowDays ?? exports.CONSULTATION_VALIDITY_DAYS;
    const stored = input.consultationValidUntil
        ? new Date(input.consultationValidUntil)
        : null;
    const storedOk = !!stored && !Number.isNaN(stored.getTime());
    const slid = storedOk &&
        !input.hasConsultationFee &&
        clinicDayKey(stored) ===
            clinicDayKey(addCalendarDays(input.visitDate, windowDays));
    if (storedOk && !slid) {
        return normalizeClinicDate(stored);
    }
    if (input.priorValidUntil) {
        return normalizeClinicDate(new Date(input.priorValidUntil));
    }
    if (input.hasConsultationFee) {
        return addCalendarDays(input.visitDate, windowDays);
    }
    return addCalendarDays(input.visitDate, windowDays);
}
//# sourceMappingURL=consultation-validity.js.map