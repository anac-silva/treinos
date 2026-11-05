import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { connectReviewBrowser } from './browserReview.mjs';

const browser = await connectReviewBrowser();
const { send, evaluate, waitFor, click, setLabel, fulfill } = browser;
const client = { id: 'review-client', name: 'Aluno exemplo', status: 'ACTIVE' };
const item = { id: 'review-appointment', clientId: client.id, client, startsAt: '2026-11-05T13:00:00.000Z', durationMinutes: 60, type: 'Avaliação', status: 'PENDING_CONFIRMATION' };
const exceptions = [];
let savedBody;
browser.onEvent(async (event) => {
  if (event.method === 'Runtime.exceptionThrown') exceptions.push(event.params.exceptionDetails.text);
  if (event.method !== 'Fetch.requestPaused') return;
  const { requestId, request } = event.params;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '');
  let body; let status = 200;
  if (path.startsWith('/auth/')) body = { user: { name: 'Personal', mustChangePassword: false }, csrfToken: 'test' };
  else if (path === '/clients') body = { items: [client], total: 1 };
  else if (['/exercises', '/measurement-types'].includes(path)) body = { items: [], total: 0 };
  else if (path === '/appointments') {
    const from = Date.parse(url.searchParams.get('from')); const to = Date.parse(url.searchParams.get('to'));
    const rows = Date.parse(item.startsAt) >= from && Date.parse(item.startsAt) <= to ? [item] : [];
    body = { items: rows, total: rows.length };
  } else if (path === '/appointments/' + item.id && request.method === 'PATCH') {
    const values = JSON.parse(request.postData);
    if (Object.keys(values).length === 1 && values.status === 'SCHEDULED') { status = 400; body = { error: { message: 'Não foi possível confirmar. Tente novamente.' } }; }
    else { savedBody = values; Object.assign(item, values); body = item; }
  } else { status = 404; body = { error: { message: 'Fixture missing: ' + path } }; }
  await fulfill(requestId, body, status);
});
try {
  await send('Runtime.enable'); await send('Page.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/*' }] });
  await send('Emulation.setTimezoneOverride', { timezoneId: 'Asia/Tokyo' });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://127.0.0.1:5189/agendamentos' });
  await waitFor(`document.querySelector('input[type=month]') && !document.querySelector('.calendar-grid[aria-busy=true]')`);
  for (const [width, height, mobile] of [[1440, 900, false], [1366, 650, false], [390, 844, true]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    for (const month of ['2027-02', '2026-04', '2026-11']) {
      await setLabel('Mês', month);
      await waitFor(`!document.querySelector('.calendar-grid[aria-busy=true]')`);
      const metrics = await evaluate(`(() => { const main = document.querySelector('.appointments-page'); const days = [...document.querySelectorAll('.calendar-day')]; return { fits: main.scrollHeight <= main.clientHeight + 1, horizontal: document.documentElement.scrollWidth <= innerWidth, lastBottom: days.at(-1).getBoundingClientRect().bottom, height: innerHeight }; })()`);
      assert.ok(metrics.fits && metrics.horizontal && metrics.lastBottom <= metrics.height, JSON.stringify({ width, height, month, metrics }));
    }
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const screenshotPath = join(tmpdir(), 'treinos-agenda-responsive.png');
  await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'));
  await evaluate(`document.querySelector('.calendar-day.has-appointments').click()`);
  await waitFor(`document.querySelector('dialog:modal') !== null`);
  await click('Confirmar');
  await waitFor(`document.querySelector('dialog:modal [role=alert]')?.textContent.includes('Não foi possível confirmar')`);
  await click('Editar');
  await waitFor(`document.querySelector('input[name=appointmentTime]') !== null`);
  assert.equal(await evaluate(`document.querySelector('input[name=appointmentTime]').value`), '10:00');
  await click('Salvar alterações');
  await waitFor(`document.querySelector('input[name=appointmentTime]') === null`);
  assert.equal(savedBody.startsAt, '2026-11-05T13:00:00.000Z');
  assert.equal(savedBody.type, 'Avaliação');
  assert.deepEqual(exceptions, []);
  console.log(JSON.stringify({ passed: true, responsiveMonths: 9, modalErrors: true, timezoneRoundTrip: true, screenshotPath }));
} finally {
  await send('Fetch.disable'); await send('Emulation.setTimezoneOverride', { timezoneId: '' }); browser.close();
}
