import assert from 'node:assert/strict';
import { connectReviewBrowser } from './browserReview.mjs';

const browser = await connectReviewBrowser();
const { send, evaluate, waitFor, fulfill } = browser;
const requests = new Map();
browser.onEvent((event) => {
  if (event.method === 'Fetch.requestPaused') requests.set(new URL(event.params.request.url).pathname, event.params.requestId);
});
async function resolve(path, body, status = 200) {
  for (let attempt = 0; !requests.has(path) && attempt < 100; attempt++) await new Promise((resolve) => setTimeout(resolve, 20));
  assert.ok(requests.has(path), 'Expected request: ' + path);
  const id = requests.get(path); requests.delete(path);
  await fulfill(id, body, status);
}
try {
  await send('Runtime.enable'); await send('Page.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/review/*' }] });
  await send('Page.navigate', { url: 'http://127.0.0.1:5189/scripts/resourceHarness.html' });
  await resolve('/api/review/a', { name: 'A' });
  await waitFor(`window.reviewState?.data?.name === 'A'`);
  await evaluate(`window.reviewQuery({ path: '/review/b', revision: 0 })`);
  await waitFor(`window.reviewState?.loading && window.reviewState.data === null`);
  await evaluate(`window.reviewQuery({ path: '/review/c', revision: 0 })`);
  await resolve('/api/review/c', { name: 'C' });
  await waitFor(`window.reviewState?.data?.name === 'C'`);
  if (requests.has('/api/review/b')) await resolve('/api/review/b', { name: 'B' });
  assert.equal(await evaluate(`window.reviewState.data.name`), 'C');
  await evaluate(`window.reviewQuery({ path: '/review/c', revision: 1 })`);
  await waitFor(`window.reviewState?.loading && window.reviewState.data === null`);
  await resolve('/api/review/c', { name: 'C updated' });
  await waitFor(`window.reviewState?.data?.name === 'C updated'`);
  await evaluate(`window.reviewQuery({ path: '/review/fail', revision: 0 })`);
  await resolve('/api/review/fail', { error: { message: 'Erro esperado' } }, 400);
  await waitFor(`window.reviewState?.error === 'Erro esperado' && !window.reviewState.loading`);
  console.log(JSON.stringify({ passed: true, resourceIsolation: true, staleResponsesIgnored: true, reload: true, errors: true }));
} finally { await send('Fetch.disable'); browser.close(); }
