const PLACEHOLDERS = new Set(['', '-', '—', 'self', 'doctor', 'n/a', 'na']);

/** A person name worth showing. Placeholders stored on a visit are not a doctor. */
export function displayDoctorName(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') {
    const text = value.trim().replace(/\s+/g, ' ');
    if (!text || PLACEHOLDERS.has(text.toLowerCase())) return '';
    return text;
  }
  if (typeof value === 'object') {
    return displayDoctorName((value as { name?: unknown }).name);
  }
  return '';
}

function isObjectId(value: object): value is { toHexString: () => string } {
  if ((value as { _bsontype?: unknown })._bsontype === 'ObjectId') return true;
  const name = value.constructor?.name;
  return (
    (name === 'ObjectId' || name === 'ObjectID') &&
    typeof (value as { toHexString?: unknown }).toHexString === 'function'
  );
}

/**
 * ObjectId string, or the id on a populated user. A display name is not an id.
 * A Mongoose ObjectId's `_id` getter returns the same ObjectId, so that value
 * is recognized before `_id` is read and is never walked again.
 */
export function doctorObjectId(
  value: unknown,
  seen?: WeakSet<object>,
): string | null {
  if (typeof value === 'string') {
    const text = value.trim();
    return /^[a-f0-9]{24}$/i.test(text) ? text : null;
  }
  if (!value || typeof value !== 'object') return null;
  if (isObjectId(value)) return value.toHexString();
  if (seen?.has(value)) return null;
  if (!('_id' in value)) return null;
  const nested = (value as { _id?: unknown })._id;
  if (!nested || nested === value) return null;
  const next = seen ?? new WeakSet<object>();
  next.add(value);
  return doctorObjectId(nested, next);
}

export type VisitDoctorSource = {
  doctor?: unknown;
  doctorName?: unknown;
};

/**
 * Doctor stored on the therapy or procedure visit.
 * The therapist is a separate field and is not read here.
 */
export function pickVisitDoctor(session: VisitDoctorSource | null | undefined): {
  id: string | null;
  name: string;
} {
  if (!session) return { id: null, name: '' };
  return {
    id: doctorObjectId(session.doctor),
    name:
      displayDoctorName(session.doctorName) || displayDoctorName(session.doctor),
  };
}
