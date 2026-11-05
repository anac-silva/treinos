import assert from 'node:assert/strict';

export async function connectReviewBrowser() {
  const targets = await (await fetch('http://127.0.0.1:9239/json/list')).json();
  const target = targets.find((item) => item.type === 'page');
  assert.ok(target, 'Inicie o Chrome isolado na porta 9239.');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  const listeners = [];
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  ws.onmessage = ({ data }) => {
    const event = JSON.parse(data);
    if (event.id) {
      const task = pending.get(event.id);
      pending.delete(event.id);
      if (event.error) task?.reject(new Error(event.error.message)); else task?.resolve(event.result);
    } else for (const listener of listeners) listener(event);
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
    throw new Error('Timed out: ' + expression);
  };
  const click = (text) => evaluate(`(() => { const button = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(text)}); if (!button) throw Error('Button missing'); button.click(); })()`);
  const setLabel = (text, value) => evaluate(`(() => {
    const label = [...document.querySelectorAll('label')].find(l => l.childNodes[0]?.textContent.trim() === ${JSON.stringify(text)});
    const input = label?.querySelector('input, select');
    if (!input) throw Error('Field missing: ' + ${JSON.stringify(text)});
    Object.getOwnPropertyDescriptor(input.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  })()`);
  const fulfill = async (requestId, body, responseCode = 200) => {
    try { await send('Fetch.fulfillRequest', { requestId, responseCode, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(body)).toString('base64') }); }
    catch (error) { if (!error.message.includes('Invalid InterceptionId')) throw error; }
  };
  return { send, evaluate, waitFor, click, setLabel, fulfill, onEvent: (listener) => listeners.push(listener), close: () => ws.close() };
}
