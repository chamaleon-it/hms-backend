import { sanitizeUser } from './sanitize-user';

describe('sanitizeUser (C1/H1)', () => {
  it('strips password and refreshToken from plain objects', () => {
    const safe = sanitizeUser({
      _id: 'abc',
      email: 'a@b.com',
      name: 'Ada',
      role: 'Pharmacy',
      password: '$2b$10$hash',
      refreshToken: 'jwt-secret-token',
    });

    expect(safe).toMatchObject({
      _id: 'abc',
      email: 'a@b.com',
      name: 'Ada',
      role: 'Pharmacy',
    });
    expect(safe).not.toHaveProperty('password');
    expect(safe).not.toHaveProperty('refreshToken');
  });

  it('strips secrets from mongoose-like toObject() documents', () => {
    const doc = {
      password: 'hash',
      refreshToken: 'rt',
      email: 'x@y.com',
      toObject() {
        return {
          password: this.password,
          refreshToken: this.refreshToken,
          email: this.email,
          role: 'Admin',
        };
      },
    };

    const safe = sanitizeUser(doc as any);
    expect(safe).toEqual({ email: 'x@y.com', role: 'Admin' });
  });

  it('returns null for nullish input', () => {
    expect(sanitizeUser(null)).toBeNull();
    expect(sanitizeUser(undefined)).toBeNull();
  });
});
