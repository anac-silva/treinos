import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useRemote } from '../lib/useRemote';

function Form({ client }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const body = { ...fields, age: fields.age === '' ? null : Number(fields.age) };
    for (const field of ['email', 'phone', 'goal', 'experienceLevel', 'notes']) body[field] = body[field].trim() || null;
    try {
      const saved = await api(client ? `/clients/${client.id}` : '/clients', { method: client ? 'PATCH' : 'POST', body });
      navigate(`/clientes/${saved.id}/visaogeral`);
    } catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  return <main className="workspace"><Link to={client ? `/clientes/${client.id}/visaogeral` : '/clientes'} className="back-link">Voltar</Link><h1>{client ? 'Editar cliente' : 'Novo cliente'}</h1>
    {!client && <p>Após salvar o cadastro, registre a avaliação inicial e envie a foto no perfil.</p>}
    {error && <p role="alert" className="catalog-error">{error}</p>}
    <form onSubmit={submit} className="form-layout">
      <label className="field full-field">Nome completo<input name="name" required maxLength={100} defaultValue={client?.name || ''} /></label>
      <label className="field">Idade<input name="age" type="number" min="0" max="150" step="1" defaultValue={client?.age ?? ''} /></label>
      <label className="field">E-mail<input name="email" type="email" maxLength={254} defaultValue={client?.email || ''} /></label>
      <label className="field">Telefone<input name="phone" type="tel" maxLength={40} defaultValue={client?.phone || ''} /></label>
      <label className="field">Objetivo<input name="goal" maxLength={100} defaultValue={client?.goal || ''} /></label>
      <label className="field">Nível de experiência<select name="experienceLevel" defaultValue={client?.experienceLevel || ''}><option value="">Selecione o nível</option><option value="Iniciante">Iniciante</option><option value="Intermediário">Intermediário</option><option value="Avançado">Avançado</option></select></label>
      {client && <label className="field">Status<select name="status" defaultValue={client.status}><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option></select></label>}
      <label className="field full-field">Observações<textarea name="notes" maxLength={5000} rows="4" defaultValue={client?.notes || ''} /></label>
      <div className="form-actions full-field"><Link className="button button-outline" to={client ? `/clientes/${client.id}/visaogeral` : '/clientes'}>Cancelar</Link><button disabled={busy} className="button button-primary">{busy ? 'Salvando…' : 'Salvar cliente'}</button></div>
    </form>
  </main>;
}
function Edit({ id }) {
  const { data, loading, error } = useRemote(`/clients/${id}`);
  if (loading) return <main className="workspace" role="status">Carregando cliente…</main>;
  if (error) return <main className="workspace"><p role="alert">{error}</p></main>;
  return <Form client={data} />;
}
export default function ClientForm() {
  const { clientId } = useParams();
  return clientId ? <Edit id={clientId} /> : <Form />;
}
