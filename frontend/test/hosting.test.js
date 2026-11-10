import { test } from 'node:test';
import assert from 'node:assert/strict';
import { frontendHostingConfig } from '../../scripts/configure-hosting.mjs';

test('hosting routes the API before the React fallback and restricts browser origins', () => {
  const config = frontendHostingConfig('https://api.example.com');
  assert.equal(config.rewrites[0].destination, 'https://api.example.com/:path*');
  assert.equal(config.rewrites[1].destination, '/index.html');
  assert.ok(config.headers[0].headers.find((header) => header.key === 'Content-Security-Policy').value.includes("connect-src 'self'"));
  for (const origin of ['http://api.example.com', 'https://api.example.com/path', 'https://user:pass@api.example.com']) assert.throws(() => frontendHostingConfig(origin));
});
