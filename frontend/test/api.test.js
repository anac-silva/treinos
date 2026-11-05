import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { api, allPages, setCsrfToken } from '../src/lib/api.js';

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
afterEach(() => { globalThis.fetch = originalFetch; globalThis.window = originalWindow; setCsrfToken(null); });
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('sessão usa cookies, CSRF em memória e rotação na troca de senha', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options });
    if (url.endsWith('/login')) return json({ user: { name: 'Personal' }, csrfToken: 'initial' });
    if (url.endsWith('/change-password')) return json({ csrfToken: 'rotated' });
    return new Response(null, { status: 204 });
  };
  await api('/auth/login', { method: 'POST', body: { email: 'p@example.test', password: 'secret' } });
  await api('/auth/change-password', { method: 'POST', body: { currentPassword: 'secret', newPassword: 'new-password' } });
  assert.equal(await api('/auth/logout', { method: 'POST' }), null);
  assert.equal(calls[0].credentials, 'include');
  assert.equal(calls[0].headers['X-CSRF-Token'], undefined);
  assert.equal(calls[1].headers['X-CSRF-Token'], 'initial');
  assert.equal(calls[2].headers['X-CSRF-Token'], 'rotated');
});

test('foto multipart mantém boundary do navegador e envia CSRF', async () => {
  setCsrfToken('csrf');
  const body = new FormData(); body.append('file', new Blob(['image'], { type: 'image/png' }), 'foto.png');
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/clients/id/photo');
    assert.equal(options.body, body);
    assert.equal(options.headers['Content-Type'], undefined);
    assert.equal(options.headers['X-CSRF-Token'], 'csrf');
    return json({ id: 'photo' });
  };
  assert.deepEqual(await api('/clients/id/photo', { method: 'POST', body }), { id: 'photo' });
});

test('erros HTTP preservam mensagem e expiração dispara saída da sessão', async () => {
  const events = [];
  globalThis.window = { dispatchEvent: (event) => events.push(event.type) };
  globalThis.fetch = async () => json({ error: { message: 'Sessão expirada.' } }, 401);
  await assert.rejects(api('/clients'), (error) => error.status === 401 && error.message === 'Sessão expirada.');
  assert.deepEqual(events, ['session-expired']);
  events.length = 0;
  await assert.rejects(api('/auth/login', { method: 'POST', body: {} }));
  assert.deepEqual(events, []);
});

test('troca obrigatória e erros de validação são comunicados', async () => {
  const events = [];
  globalThis.window = { dispatchEvent: (event) => events.push(event.type) };
  globalThis.fetch = async () => json({ error: { code: 'PASSWORD_CHANGE_REQUIRED', message: 'Troque a senha.' } }, 403);
  await assert.rejects(api('/clients'), /Troque a senha/);
  assert.deepEqual(events, ['password-required']);
  globalThis.fetch = async () => json({ error: { message: ['Nome inválido', 'Idade inválida'] } }, 400);
  await assert.rejects(api('/clients'), /Nome inválido Idade inválida/);
});

test('catálogo carrega todas as páginas, sem truncar em 100 tipos', async () => {
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    return json({ items: urls.length === 1 ? Array.from({ length: 100 }, (_, id) => ({ id })) : [{ id: 100 }], total: 101 });
  };
  assert.equal((await allPages('/measurement-types')).length, 101);
  assert.equal(urls[1], '/api/measurement-types?page=2&pageSize=100');
});

test('erro de conexão é legível e cancelamento permanece identificável', async () => {
  const failure = new TypeError('Failed to fetch');
  globalThis.fetch = async () => { throw failure; };
  await assert.rejects(api('/clients'), (error) => error.cause === failure && /conectar/.test(error.message));
  globalThis.fetch = async () => { throw new DOMException('Aborted', 'AbortError'); };
  await assert.rejects(api('/clients'), (error) => error.name === 'AbortError');
});

test('repete leitura após 502 temporário e retorna dados atualizados', async () => {
  let calls = 0;
  globalThis.fetch = async () => ++calls === 1 ? new Response('Bad Gateway', { status: 502 }) : json({ total: 2 });
  assert.deepEqual(await api('/appointments'), { total: 2 });
  assert.equal(calls, 2);
});

test('limita tentativas de leitura e não repete gravações', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response('Bad Gateway', { status: 502 }); };
  await assert.rejects(api('/appointments'), (error) => error.status === 502);
  assert.equal(calls, 3);
  calls = 0;
  await assert.rejects(api('/appointments', { method: 'POST', body: {} }), (error) => error.status === 502);
  assert.equal(calls, 1);
});

test('sair da tela cancela a espera antes da próxima tentativa', async () => {
  const controller = new AbortController();
  let calls = 0;
  globalThis.fetch = async () => { calls++; setTimeout(() => controller.abort(), 10); return new Response('Bad Gateway', { status: 502 }); };
  await assert.rejects(api('/appointments', { signal: controller.signal }), (error) => error.name === 'AbortError');
  assert.equal(calls, 1);
});

test('paginação substitui parâmetros anteriores sem perder os filtros', async () => {
  globalThis.fetch = async (url) => {
    const params = new URL(url, 'http://localhost').searchParams;
    assert.deepEqual(params.getAll('page'), ['1']);
    assert.deepEqual(params.getAll('pageSize'), ['100']);
    assert.equal(params.get('status'), 'ACTIVE');
    return json({ items: [{ id: 1 }], total: 1 });
  };
  assert.equal((await allPages('/clients?status=ACTIVE&page=8&pageSize=1')).length, 1);
});

test('paginação inconsistente falha sem entrar em repetição infinita', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return json({ items: [], total: 100 }); };
  await assert.rejects(allPages('/clients'), /paginação inválida/);
  assert.equal(calls, 1);
});
