let csrfToken;
const base = (import.meta.env?.VITE_API_URL || '/api').replace(/\/$/, '');
export const localAuthBypass = import.meta.env?.VITE_LOCAL_AUTH_BYPASS === 'true';
export function setCsrfToken(value) { csrfToken = value; }
export async function api(path, { method = 'GET', body, signal } = {}) {
  const multipart = body instanceof FormData;
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method, signal, credentials: 'include',
      headers: { ...(body && !multipart ? { 'Content-Type': 'application/json' } : {}),
        ...(method !== 'GET' && csrfToken ? { 'X-CSRF-Token': csrfToken } : {}) },
      body: body ? (multipart ? body : JSON.stringify(body)) : undefined,
    });
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
  const items = [];
  let page = 1;
  let result;
  do {
    result = await api(`${path}${path.includes('?') ? '&' : '?'}page=${page++}&pageSize=100`, { signal });
    items.push(...result.items);
  } while (items.length < result.total);
  return items;
}
