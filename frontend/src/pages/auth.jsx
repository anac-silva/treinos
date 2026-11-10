import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import { localAuthBypass } from '../lib/api';

export default function AuthPage({ change = false }) {
  const auth = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  if (auth.loading) return <main className="workspace" role="status">Verificando sessão…</main>;
  if (!change && auth.user) return <Navigate to={auth.user.mustChangePassword ? '/alterar-senha' : '/'} replace />;
  if (localAuthBypass && !auth.user) return <main className="workspace auth-page"><h1>Acesso local ao Treinos</h1><p>O acesso neste computador é automático, sem e-mail ou senha.</p>{auth.error && <p role="alert" className="catalog-error">{auth.error}</p>}<button type="button" className="button button-primary" onClick={() => window.location.reload()}>Tentar novamente</button></main>;
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (change && values.newPassword !== values.confirmPassword) { setError('As novas senhas não conferem.'); return; }
    setBusy(true); setError(''); setSuccess('');
    try {
      if (change) await auth.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      else await auth.login(values);
      if (change) { event.target.reset(); setSuccess('Senha alterada com sucesso.'); }
    } catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  return <main className="workspace auth-page"><h1>{change ? 'Alterar senha' : 'Entrar no Treinos'}</h1>
    {change && auth.user.mustChangePassword && <p>Troque a senha inicial para acessar o sistema.</p>}
    {(error || auth.error) && <p role="alert" className="catalog-error">{error || auth.error}</p>}
    {success && <p role="status" className="catalog-success">{success}</p>}
    <form onSubmit={submit} className="form-layout">
      {!change && <label className="field full-field">E-mail<input name="email" type="email" required autoComplete="username" /></label>}
      <label className="field full-field">{change ? 'Senha atual' : 'Senha'}<input name={change ? 'currentPassword' : 'password'} type="password" required maxLength={128} autoComplete="current-password" /></label>
      {change && <><label className="field full-field">Nova senha<input name="newPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label><label className="field full-field">Confirmar nova senha<input name="confirmPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label></>}
      <button disabled={busy} className="button button-primary">{busy ? 'Aguarde…' : change ? 'Alterar senha' : 'Entrar'}</button>
    </form>
  </main>;
}
