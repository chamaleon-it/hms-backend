"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.displayDoctorName = displayDoctorName;
exports.doctorObjectId = doctorObjectId;
exports.pickVisitDoctor = pickVisitDoctor;
const PLACEHOLDERS = new Set(['', '-', '—', 'self', 'doctor', 'n/a', 'na']);
function displayDoctorName(value) {
    if (value == null)
        return '';
    if (typeof value === 'string') {
        const text = value.trim().replace(/\s+/g, ' ');
        if (!text || PLACEHOLDERS.has(text.toLowerCase()))
            return '';
        return text;
    }
    if (typeof value === 'object') {
        return displayDoctorName(value.name);
    }
    return '';
}
function isObjectId(value) {
    if (value._bsontype === 'ObjectId')
        return true;
    const name = value.constructor?.name;
    return ((name === 'ObjectId' || name === 'ObjectID') &&
        typeof value.toHexString === 'function');
}
function doctorObjectId(value, seen) {
    if (typeof value === 'string') {
        const text = value.trim();
        return /^[a-f0-9]{24}$/i.test(text) ? text : null;
    }
    if (!value || typeof value !== 'object')
        return null;
    if (isObjectId(value))
        return value.toHexString();
    if (seen?.has(value))
        return null;
    if (!('_id' in value))
        return null;
    const nested = value._id;
    if (!nested || nested === value)
        return null;
    const next = seen ?? new WeakSet();
    next.add(value);
    return doctorObjectId(nested, next);
}
function pickVisitDoctor(session) {
    if (!session)
        return { id: null, name: '' };
    return {
        id: doctorObjectId(session.doctor),
        name: displayDoctorName(session.doctorName) || displayDoctorName(session.doctor),
    };
}
//# sourceMappingURL=session-doctor.js.map