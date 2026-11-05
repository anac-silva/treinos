import { useEffect, useState } from 'react';
import { api, localAuthBypass, setCsrfToken } from '../lib/api';
import { AuthContext } from './authContext';

let localSessionPromise;
function refreshLocalSession() {
  if (!localSessionPromise) {
    localSessionPromise = api('/auth/local', { method: 'POST' }).finally(() => { localSessionPromise = null; });
  }
  return localSessionPromise;
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const sessionRequest = localAuthBypass
      ? api('/auth/local', { method: 'POST', signal: controller.signal })
      : api('/auth/me', { signal: controller.signal });
    sessionRequest.then((data) => {
      if (!controller.signal.aborted) setUser(localAuthBypass ? { ...data.user, mustChangePassword: false } : data.user);
    }).catch((error) => {
      if (error.name !== 'AbortError' && error.status !== 401) setError(error.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    const expired = () => {
      setCsrfToken(null);
      if (!localAuthBypass) { setUser(null); return; }
      refreshLocalSession().then((data) => {
        setUser({ ...data.user, mustChangePassword: false });
        setError('');
      }).catch((sessionError) => { setUser(null); setError(sessionError.message); });
    };
    const required = () => setUser((user) => user ? { ...user, mustChangePassword: true } : user);
    window.addEventListener('session-expired', expired);
    window.addEventListener('password-required', required);
    return () => { controller.abort(); window.removeEventListener('session-expired', expired); window.removeEventListener('password-required', required); };
  }, []);
  async function login(body) { const data = await api('/auth/login', { method: 'POST', body }); setUser(data.user); setError(''); }
  async function changePassword(body) { const data = await api('/auth/change-password', { method: 'POST', body }); setUser(data.user); }
  async function logout() { await api('/auth/logout', { method: 'POST' }); setUser(null); setCsrfToken(null); }
  return <AuthContext.Provider value={{ user, loading, error, login, logout, changePassword }}>{children}</AuthContext.Provider>;
}
