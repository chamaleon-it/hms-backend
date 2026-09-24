/**
 * Strip secrets from user documents before returning them in API responses.
 * Top-level accessToken / refreshToken on the auth payload are returned separately.
 */
export function sanitizeUser<T extends Record<string, any>>(
  user: T | null | undefined,
): Omit<T, 'password' | 'refreshToken'> | null {
  if (!user) return null;

  const plain =
    typeof (user as any).toObject === 'function'
      ? (user as any).toObject()
      : { ...user };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, refreshToken: _refreshToken, ...safe } = plain;
  return safe;
}
