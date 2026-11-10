import 'dotenv/config';

export type AppConfig = ReturnType<typeof readConfig>;
export const APP_CONFIG = Symbol('APP_CONFIG');

export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const production = env.NODE_ENV === 'production';
  if (!['development', 'test', 'production'].includes(env.NODE_ENV || 'development')) throw new Error('NODE_ENV inválido.');
  if (env.LOCAL_AUTH_BYPASS !== undefined && !['true', 'false'].includes(env.LOCAL_AUTH_BYPASS)) throw new Error('LOCAL_AUTH_BYPASS deve ser true ou false.');
  const localAuthBypass = env.LOCAL_AUTH_BYPASS === 'true';
  if (localAuthBypass && (production || env.NODE_ENV === 'test')) throw new Error('LOCAL_AUTH_BYPASS só pode ser usado em desenvolvimento local.');
  if (!env.DATABASE_URL || !/^postgres(ql)?:\/\//.test(env.DATABASE_URL)) throw new Error('Configure DATABASE_URL para PostgreSQL.');
  const databaseUrl = new URL(env.DATABASE_URL);
  if (production && !['require', 'verify-ca', 'verify-full'].includes(databaseUrl.searchParams.get('sslmode') || '')) throw new Error('DATABASE_URL deve exigir TLS em produção (sslmode=require ou verify-full).');
  const origins = (env.CORS_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
  if (!origins.length) throw new Error('Configure CORS_ORIGINS explicitamente.');
  for (const origin of origins) {
    const url = new URL(origin);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin || (production && url.protocol !== 'https:')) throw new Error('CORS_ORIGINS deve conter origens válidas; HTTPS em produção.');
  }
  const port = Number(env.PORT || 3000);
  const sessionTtlHours = Number(env.SESSION_TTL_HOURS || 12);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválida.');
  if (!Number.isInteger(sessionTtlHours) || sessionTtlHours < 1 || sessionTtlHours > 168) throw new Error('SESSION_TTL_HOURS deve estar entre 1 e 168.');
  const trustProxy = env.TRUST_PROXY || 'false';
  if (trustProxy === 'true') throw new Error('TRUST_PROXY deve ser false ou uma lista explícita de proxies/IPs confiáveis.');
  return { production, localAuthBypass, port, origins, sessionTtlHours, databaseUrl: env.DATABASE_URL,
    cookieName: production ? '__Host-personal_session' : 'personal_session',
    // Vercel overwrites forwarded headers at its ingress. Trust only the immediate hop there.
    trustProxy: env.VERCEL === '1' ? ((_ip: string, hop: number) => hop === 0) : trustProxy === 'false' ? false as const : trustProxy.split(',').map((value) => value.trim()),
  };
}
