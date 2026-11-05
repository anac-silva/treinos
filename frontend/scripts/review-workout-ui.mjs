// Manual browser integration check using an isolated Chrome debugging session.
// Start Vite on 5189 and Chrome with --remote-debugging-port=9239 first.
// All API requests below are intercepted; no real client data is changed.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const targets = await (await fetch('http://127.0.0.1:9239/json/list')).json();
const target = targets.find((item) => item.type === 'page' && (item.url === 'about:blank' || item.url.startsWith('http://127.0.0.1:5189/')));
assert.ok(target, 'Open an about:blank tab in the isolated review browser.');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let sequence = 0;
const pending = new Map();
const exceptions = [];
const savedSheets = [];
const client = { id: '00000000-0000-4000-8000-000000000001', name: 'Cliente demonstração', status: 'ACTIVE', sex: 'FEMALE', age: 28, experienceLevel: 'Iniciante', photos: [] };
const exercise = { id: '00000000-0000-4000-8000-000000000002', name: 'Agachamento livre' };
const makeBlock = (id, title, focus) => ({ id, title, focus, level: 'BASIC', notes: '', clientId: null, sheetId: null, createdAt: new Date().toISOString(), exercises: [{ id: crypto.randomUUID(), exerciseId: exercise.id, exercise, sets: 3, repetitions: '10', restSeconds: 60 }] });
const templates = [makeBlock('00000000-0000-4000-8000-000000000003', 'Superiores variação 1', 'Superiores'), makeBlock('00000000-0000-4000-8000-000000000004', 'Inferiores variação 2', 'Inferiores')];
const pageOf = (items) => ({ items, total: items.length, page: 1, pageSize: 100 });
function send(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
}
ws.onmessage = async ({ data }) => {
  const event = JSON.parse(data);
  if (event.id) {
    const task = pending.get(event.id);
    pending.delete(event.id);
    if (event.error) task?.reject(new Error(event.error.message)); else task?.resolve(event.result);
  } else if (event.method === 'Runtime.exceptionThrown') {
    exceptions.push(event.params.exceptionDetails.text);
  } else if (event.method === 'Page.javascriptDialogOpening') {
    await send('Page.handleJavaScriptDialog', { accept: true });
  } else if (event.method === 'Fetch.requestPaused') {
    const { requestId, request } = event.params;
    const path = new URL(request.url).pathname.replace(/^\/api/, '');
    let result;
    let status = 200;
    if (path.startsWith('/auth/')) result = { user: { id: 'review-user', name: 'Personal demonstração', mustChangePassword: false }, csrfToken: 'review' };
    else if (path === '/exercises') result = pageOf([exercise]);
    else if (path === '/measurement-types') result = pageOf([]);
    else if (path === `/clients/${client.id}`) result = client;
    else if (path === '/clients') result = pageOf([client]);
    else if (path === '/workouts' && request.method === 'GET') result = pageOf(templates);
    else if (path === '/workout-sheets' && request.method === 'GET') {
      const params = new URL(request.url).searchParams;
      let rows = savedSheets.filter((sheet) => (!params.has('clientId') || sheet.clientId === params.get('clientId')) && (params.get('templatesOnly') !== 'true' || !sheet.clientId) && (!params.has('isActive') || String(sheet.isActive) === params.get('isActive')));
      if (params.get('view') === 'summary') rows = rows.map(({ blocks, ...sheet }) => ({ ...sheet, _count: { blocks: blocks.length } }));
      result = pageOf(rows);
    } else if (path.startsWith('/workout-sheets/') && request.method === 'GET') result = savedSheets.find((sheet) => sheet.id === path.split('/').at(-1));
    else if (path === '/workout-sheets' && request.method === 'POST') {
      const body = JSON.parse(request.postData);
      for (const sheet of savedSheets.filter((item) => item.clientId === body.clientId)) sheet.isActive = false;
      result = { ...body, id: crypto.randomUUID(), createdAt: new Date().toISOString(), isActive: Boolean(body.clientId), client: body.clientId ? client : null, blocks: body.blocks.map((block, position) => ({ ...block, id: crypto.randomUUID(), position, exercises: block.exercises.map((item) => ({ ...item, id: crypto.randomUUID(), exercise })) })) };
      savedSheets.unshift(result); status = 201;
    } else if (path === '/workouts' && request.method === 'POST') {
      result = { ...JSON.parse(request.postData), id: crypto.randomUUID(), createdAt: new Date().toISOString(), exercises: JSON.parse(request.postData).exercises.map((item) => ({ ...item, id: crypto.randomUUID(), exercise })) };
      templates.push(result); status = 201;
    } else if (path.startsWith('/workouts/') && request.method === 'PUT') {
      const index = templates.findIndex((item) => item.id === path.split('/').at(-1));
      result = { ...templates[index], ...JSON.parse(request.postData), exercises: JSON.parse(request.postData).exercises.map((item) => ({ ...item, id: crypto.randomUUID(), exercise })) };
      templates[index] = result;
    } else { status = 404; result = { error: { message: `Review fixture missing: ${path}` } }; }
    try {
      await send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(result)).toString('base64') });
    } catch (error) {
      // React StrictMode aborts the first request while checking effect cleanup.
      if (!error.message.includes('Invalid InterceptionId')) exceptions.push(error.message);
    }
  }
};
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const waitFor = async (expression) => {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out: ${expression}`);
};
const click = async (text) => evaluate(`(() => { const button = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(text)}); if (!button) throw Error('Button not found: ' + ${JSON.stringify(text)}); button.click(); })()`);
const setLabel = async (text, value) => evaluate(`(() => { const label = [...document.querySelectorAll('label')].find(l => l.childNodes[0]?.textContent.trim() === ${JSON.stringify(text)}); const input = label?.querySelector('input, select'); if (!input) throw Error('Field not found: '+${JSON.stringify(text)}); Object.getOwnPropertyDescriptor(input.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', {bubbles:true})); })()`);
const chooseTemplate = (template) => evaluate(`(() => { const row = [...document.querySelectorAll('.template-result')].find(row => row.querySelector('strong').textContent === ${JSON.stringify(template.title)}); if (!row) throw Error('Template missing'); row.querySelector('button').click(); })()`);
try {
  await send('Runtime.enable'); await send('Page.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/*' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://127.0.0.1:5189/clientes/${client.id}/treinos` });
  await waitFor(`document.body?.textContent.includes('Nova ficha')`);
  await click('Nova ficha'); await setLabel('Nome da ficha', 'Ficha combinada de demonstração');
  assert.equal(await evaluate(`document.querySelectorAll('.sheet-block-editor').length`), 0);
  assert.equal(await evaluate(`document.querySelectorAll('[role="tab"]').length`), 0);
  assert.equal(await evaluate(`document.querySelector('.sheet-editor .form-actions .button-primary').disabled`), true);
  await click('Adicionar modelo de bloco');
  assert.equal(await evaluate(`document.querySelectorAll('.sheet-block-editor').length`), 0);
  assert.equal(await evaluate(`document.querySelectorAll('.template-result').length`), 2);
  assert.equal(await evaluate(`document.querySelectorAll('.template-picker select').length`), 1);
  await setLabel('Buscar modelo', 'Inferiores');
  assert.equal(await evaluate(`document.querySelectorAll('.template-result').length`), 1);
  await setLabel('Buscar modelo', 'modelo inexistente');
  assert.equal(await evaluate(`document.querySelectorAll('.template-result').length`), 0);
  await setLabel('Buscar modelo', '');
  await setLabel('N\u00edvel', 'ADVANCED');
  assert.equal(await evaluate(`document.querySelectorAll('.template-result').length`), 0);
  await setLabel('N\u00edvel', '');
  assert.equal(await evaluate(`document.querySelectorAll('.template-result').length`), 2);
  await click('Adicionar modelo de bloco');
  await click('Treino vazio');
  await waitFor(`document.querySelectorAll('.sheet-block-editor').length === 1`);
  assert.equal(await evaluate(`document.querySelectorAll('[role="tab"]').length`), 1);
  await click('Remover bloco');
  await waitFor(`document.querySelectorAll('.sheet-block-editor').length === 0`);
  await click('Adicionar modelo de bloco'); await chooseTemplate(templates[0]);
  assert.equal(await evaluate(`document.querySelectorAll('[role="tab"]').length`), 1);
  await click('Adicionar modelo de bloco'); await chooseTemplate(templates[1]);
  await setLabel('Nome do treino', 'Inferiores ajustado'); await setLabel('Séries', '4');
  assert.equal(await evaluate(`document.querySelectorAll('[role="tab"]').length`), 2);
  await click('Salvar ficha e definir como atual');
  await waitFor(`document.body?.textContent.includes('Ficha atual')`);
  assert.equal(savedSheets[0].blocks.length, 2);
  assert.equal(savedSheets[0].blocks[1].exercises[0].sets, 4);
  assert.equal(templates[1].exercises[0].sets, 3);
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true);
  const desktop = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const desktopPath = join(tmpdir(), 'treinos-ficha-desktop.png');
  await writeFile(desktopPath, Buffer.from(desktop.data, 'base64'));
  await click('Copiar ficha completa');
  await waitFor(`document.querySelector('.sheet-source-list button') !== null`);
  await evaluate(`document.querySelector('.sheet-source-list button').click()`);
  await waitFor(`document.querySelector('input[placeholder]') !== null && document.body?.textContent.includes('Nome da ficha')`);
  await setLabel('Nome da ficha', 'Nova versão copiada');
  await click('Salvar ficha e definir como atual');
  await waitFor(`document.body?.textContent.includes('Nova versão copiada') && document.body?.textContent.includes('Ficha atual')`);
  assert.equal(savedSheets.length, 2); assert.equal(savedSheets.filter((sheet) => sheet.isActive).length, 1);
  assert.equal(savedSheets[0].sourceSheetId, savedSheets[1].id);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await new Promise((resolve) => setTimeout(resolve, 200));
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true);
  const mobile = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const mobilePath = join(tmpdir(), 'treinos-ficha-mobile.png');
  await writeFile(mobilePath, Buffer.from(mobile.data, 'base64'));
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await click('Ajustar ficha');
  await click('Substituir por modelo');
  await chooseTemplate(templates[1]);
  await setLabel('Nome da ficha', 'Ficha com bloco substituído');
  await click('Salvar ficha e definir como atual');
  await waitFor(`document.body?.textContent.includes('Ficha com bloco substituído') && document.body?.textContent.includes('Ficha atual')`);
  assert.equal(savedSheets[0].blocks[0].title, templates[1].title);
  assert.equal(savedSheets[0].blocks[1].title, 'Inferiores ajustado');
  await click('Salvar como modelo');
  await setLabel('Nome da ficha', 'Modelo completo para reutilizar');
  await click('Salvar modelo de ficha');
  await waitFor(`document.body?.textContent.includes('Ficha atual')`);
  assert.ok(savedSheets.some((sheet) => sheet.title === 'Modelo completo para reutilizar' && !sheet.clientId && !sheet.isActive));
  await send('Page.navigate', { url: 'http://127.0.0.1:5189/treinos' });
  await waitFor(`document.body?.textContent.includes('Novo modelo de bloco')`);
  await click('Novo modelo de bloco');
  await setLabel('Nome do treino', 'Costas e bíceps — variação livre');
  await setLabel('Foco', 'Costas e bíceps');
  await setLabel('Adicionar exercício', exercise.id);
  await click('Adicionar'); await click('Salvar modelo');
  await waitFor(`document.body?.textContent.includes('Costas e bíceps — variação livre') && document.body?.textContent.includes('Novo modelo de bloco')`);
  assert.equal(templates.length, 3);
  await click('Fichas completas');
  await waitFor(`document.body?.textContent.includes('Modelo completo para reutilizar')`);
  const libraryImage = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const libraryPath = join(tmpdir(), 'treinos-biblioteca-fichas.png');
  await writeFile(libraryPath, Buffer.from(libraryImage.data, 'base64'));
  assert.deepEqual(exceptions, []);
  console.log(JSON.stringify({ passed: true, blocks: 2, independentCopies: true, sheetHistory: true, replaceSingleBlock: true, saveCompleteTemplate: true, createBlockTemplate: true, noHorizontalOverflow: true, desktopPath, mobilePath, libraryPath }));
} finally { ws.close(); }
