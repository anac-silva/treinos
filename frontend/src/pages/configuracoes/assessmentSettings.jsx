import { useState } from 'react';
import { useRemote } from '../../lib/useRemote';
import { api } from '../../lib/api';

function SettingsForm({ settings }) {
  const [days, setDays] = useState(settings.assessmentIntervalDays);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      await api('/settings', { method: 'PATCH', body: { assessmentIntervalDays: Number(days) } });
      setMessage('Tempo médio de avaliações salvo.');
    } catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  return <form className="catalog-form" onSubmit={save}>
    <label className="field">Tempo médio de avaliações (dias)<input type="number" min="1" max="3650" step="1" required value={days} onChange={(event) => setDays(event.target.value)} /></label>
    <button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button>
    {message && <p role="status" className="catalog-success">{message}</p>}{error && <p role="alert" className="catalog-error">{error}</p>}
  </form>;
}
export default function AssessmentSettings() {
  const { data, loading, error } = useRemote('/settings');
  return <section className="settings-section"><h2>Avaliações</h2><p>Na lista de alunos, o tempo desde a última avaliação fica vermelho quando ultrapassa este prazo.</p>
    {loading ? <p role="status">Carregando configuração…</p> : error ? <p role="alert">{error}</p> : data && <SettingsForm settings={data} />}
  </section>;
}
