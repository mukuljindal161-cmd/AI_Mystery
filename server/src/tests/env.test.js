import { describe, expect, it } from 'vitest';
import { readEnv } from '../config/env.js';
const base = { MONGODB_URI: 'mongodb://localhost/test', GEMINI_API_KEY: 'test' };
describe('deployment environment', () => {
  it('uses system DNS by default and accepts an explicit local override', () => {
    expect(readEnv(base).DNS_SERVERS).toEqual([]);
    expect(readEnv({ ...base, DNS_SERVERS: '1.1.1.1, 1.0.0.1' }).DNS_SERVERS).toEqual([
      '1.1.1.1',
      '1.0.0.1',
    ]);
    expect(() => readEnv({ ...base, DNS_SERVERS: 'not-an-ip' })).toThrow('DNS_SERVERS');
  });
  it('normalizes a trailing slash for CORS and rejects paths', () => {
    expect(readEnv({ ...base, CLIENT_ORIGIN: 'https://example.vercel.app/' }).CLIENT_ORIGIN).toBe(
      'https://example.vercel.app',
    );
    expect(() => readEnv({ ...base, CLIENT_ORIGIN: 'https://example.vercel.app/create' })).toThrow(
      'CLIENT_ORIGIN',
    );
  });
  it('requires a public HTTPS frontend origin in production', () => {
    for (const origin of [undefined, 'http://localhost:5173', 'https://localhost:5173']) {
      expect(() => readEnv({ ...base, NODE_ENV: 'production', CLIENT_ORIGIN: origin })).toThrow(
        'CLIENT_ORIGIN',
      );
    }
    expect(
      readEnv({
        ...base,
        NODE_ENV: 'production',
        CLIENT_ORIGIN: 'https://example.vercel.app',
        PORT: '10000',
      }).PORT,
    ).toBe(10000);
  });
});
