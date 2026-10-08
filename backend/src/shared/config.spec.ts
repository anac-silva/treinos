import { readConfig } from './config';
const base = { DATABASE_URL: 'postgresql://test:test@localhost/test', CORS_ORIGINS: 'http://localhost:5173' };
describe('configuração segura', () => {
  it('exige banco e origens explícitos', () => {
    expect(() => readConfig({})).toThrow();
    expect(() => readConfig({ DATABASE_URL: base.DATABASE_URL })).toThrow();
  });
  it('exige HTTPS em produção e não confia em qualquer proxy', () => {
    expect(() => readConfig({ ...base, NODE_ENV: 'production' })).toThrow();
    expect(() => readConfig({ ...base, TRUST_PROXY: 'true' })).toThrow();
    expect(readConfig({ ...base, NODE_ENV: 'production', CORS_ORIGINS: 'https://personal.example' }).cookieName).toBe('__Host-personal_session');
  });
});
