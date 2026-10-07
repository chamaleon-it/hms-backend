/** Accept a legacy single string or a list, and store a list or null. */
export function normalizeDigestiveSystem(value: unknown): string[] | null {
  if (value == null) return null;
  const raw = Array.isArray(value) ? value : [value];
  const items = raw
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return items.length > 0 ? items : null;
}
