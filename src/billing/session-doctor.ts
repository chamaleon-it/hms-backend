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

/** ObjectId string, or the id on a populated user. A display name is not an id. */
export function doctorObjectId(value: unknown): string | null {
  if (typeof value === 'string') {
    const text = value.trim();
    return /^[a-f0-9]{24}$/i.test(text) ? text : null;
  }
  if (value && typeof value === 'object' && '_id' in value) {
    return doctorObjectId((value as { _id?: unknown })._id);
  }
  return null;
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
