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
    expect(() => readConfig({ ...base, NODE_ENV: 'production', LOCAL_AUTH_BYPASS: 'true', CORS_ORIGINS: 'https://personal.example' })).toThrow();
    expect(() => readConfig({ ...base, NODE_ENV: 'test', LOCAL_AUTH_BYPASS: 'true' })).toThrow();
    expect(readConfig({ ...base, NODE_ENV: 'production', CORS_ORIGINS: 'https://personal.example' }).cookieName).toBe('__Host-personal_session');
  });
  it('só ativa o acesso local sem senha quando explicitamente configurado', () => {
    expect(readConfig({ ...base, NODE_ENV: 'development' }).localAuthBypass).toBe(false);
    expect(readConfig({ ...base, NODE_ENV: 'development', LOCAL_AUTH_BYPASS: 'true' }).localAuthBypass).toBe(true);
    expect(() => readConfig({ ...base, LOCAL_AUTH_BYPASS: 'yes' })).toThrow();
  });
});
