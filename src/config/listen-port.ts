/** Port the HTTP server binds. Cloudways sets PORT; local runs default to 3001. */
export function listenPort(raw: string | undefined): number {
  if (raw == null || raw.trim() === '') {
    return 3001;
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid PORT "${raw}". Expected an integer from 1 to 65535.`,
    );
  }
  return port;
}
