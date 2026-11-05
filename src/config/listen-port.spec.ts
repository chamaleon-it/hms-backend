import { listenPort } from './listen-port';

describe('listenPort', () => {
  it('defaults to 3001 when PORT is unset', () => {
    expect(listenPort(undefined)).toBe(3001);
    expect(listenPort('')).toBe(3001);
    expect(listenPort('   ')).toBe(3001);
  });

  it('uses a numeric PORT injected by the host', () => {
    expect(listenPort('8080')).toBe(8080);
    expect(listenPort(' 443 ')).toBe(443);
  });

  it('rejects a PORT that cannot be bound', () => {
    expect(() => listenPort('0')).toThrow(/Invalid PORT/);
    expect(() => listenPort('65536')).toThrow(/Invalid PORT/);
    expect(() => listenPort('abc')).toThrow(/Invalid PORT/);
    expect(() => listenPort('3001.5')).toThrow(/Invalid PORT/);
  });
});
