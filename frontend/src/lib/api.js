let csrfToken;
const base = (import.meta.env?.VITE_API_URL || '/api').replace(/\/$/, '');
export const localAuthBypass = import.meta.env?.DEV && import.meta.env?.VITE_LOCAL_AUTH_BYPASS === 'true';
export const photosEnabled = import.meta.env?.VITE_PHOTOS_ENABLED !== 'false';
export function setCsrfToken(value) { csrfToken = value; }

function waitForRetry(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(signal.reason || new DOMException('Aborted', 'AbortError')); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, milliseconds);
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
  });
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  const multipart = body instanceof FormData;
  let response;
  try {
    for (let attempt = 0; ; attempt++) {
      signal?.throwIfAborted();
      response = await fetch(`${base}${path}`, {
        method, signal, credentials: 'include',
        headers: { ...(body && !multipart ? { 'Content-Type': 'application/json' } : {}),
          ...(method !== 'GET' && csrfToken ? { 'X-CSRF-Token': csrfToken } : {}) },
        body: body ? (multipart ? body : JSON.stringify(body)) : undefined,
      });
      if (method !== 'GET' || ![502, 503, 504].includes(response.status) || attempt >= 2) break;
      await response.body?.cancel();
      await waitForRetry(300 * (attempt + 1), signal);
    }
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível conectar à API. Confira se o servidor está iniciado.', { cause: error });
  }
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login') window.dispatchEvent(new Event('session-expired'));
    if (data?.error?.code === 'PASSWORD_CHANGE_REQUIRED') window.dispatchEvent(new Event('password-required'));
    const message = data?.error?.message;
    const error = new Error((Array.isArray(message) ? message.join(' ') : message) || `API indisponível (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  if (data?.csrfToken) setCsrfToken(data.csrfToken);
  return data;
}
export async function allPages(path, signal) {
  const [resource, search] = path.split('?');
  const params = new URLSearchParams(search);
  params.set('page', '1');
  params.set('pageSize', '100');
  const items = [];
  let page = 1;
  let result;
  do {
    params.set('page', String(page++));
    result = await api(`${resource}?${params}`, { signal });
    if (!Array.isArray(result?.items) || !Number.isInteger(result.total) || result.total < 0 || (!result.items.length && items.length < result.total)) {
      throw new Error('A API retornou uma paginação inválida. Tente novamente.');
    }
    items.push(...result.items);
  } while (items.length < result.total);
  return items;
}
