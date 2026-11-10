import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function frontendHostingConfig(apiOrigin) {
  const url = new URL(apiOrigin);
  if (url.protocol !== 'https:' || url.origin !== apiOrigin || url.username || url.password) throw new Error('Informe somente a origem HTTPS da API, sem barra final.');
  return {
    $schema: 'https://openapi.vercel.sh/vercel.json', framework: 'vite',
    buildCommand: 'npm run build', outputDirectory: 'dist',
    rewrites: [{ source: '/api/:path*', destination: `${url.origin}/:path*` }, { source: '/((?!api(?:/|$)).*)', destination: '/index.html' }],
    headers: [{ source: '/(.*)', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
      { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self' data:; frame-src 'self' about:; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
    ] }],
  };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const apiOrigin = process.argv[2];
  if (!apiOrigin) throw new Error('Uso: node scripts/configure-hosting.mjs https://SUA-API.vercel.app');
  writeFileSync(new URL('../frontend/vercel.json', import.meta.url), JSON.stringify(frontendHostingConfig(apiOrigin), null, 2) + '\n');
  console.log('frontend/vercel.json configurado. Defina CORS_ORIGINS na API com a URL HTTPS do front.');
}
