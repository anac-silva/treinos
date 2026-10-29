import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCamera } from 'react-icons/fi';
import { api } from '../lib/api';
import { useRemote } from '../lib/useRemote';
import './clientForm.css';

function Form({ client }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [createdId, setCreatedId] = useState(null);
  const [assessmentSaved, setAssessmentSaved] = useState(false);
  const [height, setHeight] = useState('');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const { weightKg, heightM, ...fields } = Object.fromEntries(new FormData(event.currentTarget));
    const body = { ...fields, age: fields.age === '' ? null : Number(fields.age) };
    for (const field of ['email', 'phone', 'goal', 'experienceLevel', 'notes']) body[field] = body[field].trim() || null;
    let savedId = client?.id || createdId;
    try {
      const saved = await api(savedId ? `/clients/${savedId}` : '/clients', { method: savedId ? 'PATCH' : 'POST', body });
      savedId = saved.id;
      if (!client) setCreatedId(savedId);
      if (!client && weightKg && !assessmentSaved) {
        const assessedOn = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date());
        await api(`/clients/${savedId}/assessments`, { method: 'POST', body: { assessedOn, weightKg: Number(weightKg), heightCm: heightM ? Number((Number(heightM) * 100).toFixed(2)) : null, measurements: [] } });
        setAssessmentSaved(true);
      }
      if (photo) {
        const upload = new FormData(); upload.append('file', photo);
        await api(`/clients/${savedId}/photo`, { method: 'POST', body: upload });
      }
      navigate(`/clientes/${savedId}/visaogeral`);
    } catch (requestError) { setError((savedId && !client ? 'Cliente cadastrado. Não foi possível concluir a avaliação ou a foto. Tente salvar novamente: ' : '') + requestError.message); } finally { setBusy(false); }
  }
  function selectPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setError('Selecione uma foto JPEG, PNG ou WebP de até 5 MB.'); event.target.value = ''; return; }
    setPhoto(file); setError('');
    const reader = new FileReader(); reader.onload = () => setPreview(reader.result); reader.readAsDataURL(file);
  }
  return <main className="workspace client-editor-page"><div className="client-editor-card">
    <Link to={client ? `/clientes/${client.id}/visaogeral` : '/clientes'} className="back-link"><FiArrowLeft aria-hidden="true" />{client ? 'Voltar para o perfil' : 'Voltar para Clientes'}</Link>
    <header className="new-client-heading"><div><h1>{client ? 'Editar cliente' : 'Novo Cliente'}</h1><p>{client ? 'Atualize os dados do aluno.' : 'Preencha os dados para cadastrar um novo aluno.'}</p></div>
      <label className="client-photo-picker"><span className="client-photo-circle">{preview ? <img src={preview} alt="Prévia da foto selecionada" /> : <FiCamera aria-hidden="true" />}</span><span>{photo ? 'Trocar foto' : 'Adicionar foto'}</span><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={selectPhoto} /></label>
    </header>
    {error && <p role="alert" className="catalog-error">{error}</p>}
    <form onSubmit={submit} className="form-layout client-form-layout">
      <label className="field full-field">Nome completo *<input name="name" required maxLength={100} autoComplete="name" placeholder="Ex.: João da Silva" defaultValue={client?.name || ''} /></label>
      <label className="field">Idade<input name="age" type="number" min="0" max="150" step="1" placeholder="Ex.: 25" defaultValue={client?.age ?? ''} /></label>
      {!client && <><label className="field">Peso (kg)<input name="weightKg" type="number" min="0.001" max="9999.999" step="0.001" placeholder="Ex.: 70" required={Boolean(height) && !assessmentSaved} disabled={assessmentSaved} /></label><label className="field">Altura (m)<input name="heightM" type="number" min="0.01" max="3" step="0.01" placeholder="Ex.: 1,75" value={height} onChange={(event) => setHeight(event.target.value)} disabled={assessmentSaved} /></label></>}
      <label className="field client-email">E-mail<input name="email" type="email" maxLength={254} autoComplete="email" placeholder="exemplo@email.com" defaultValue={client?.email || ''} /></label>
      <label className="field">Telefone<input name="phone" type="tel" maxLength={40} autoComplete="tel" placeholder="(00) 00000-0000" defaultValue={client?.phone || ''} /></label>
      <label className="field client-goal">Objetivo principal<input name="goal" list="client-goals" maxLength={100} placeholder="Selecione ou digite o objetivo" defaultValue={client?.goal || ''} /></label>
      <datalist id="client-goals"><option value="Emagrecimento" /><option value="Hipertrofia" /><option value="Condicionamento" /></datalist>
      <label className="field client-level">Nível de experiência<select name="experienceLevel" defaultValue={client?.experienceLevel || ''}><option value="">Selecione o nível</option><option value="Iniciante">Iniciante</option><option value="Intermediário">Intermediário</option><option value="Avançado">Avançado</option></select></label>
      {client && <label className="field">Status<select name="status" defaultValue={client.status}><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option></select></label>}
      <label className="field full-field">Observações<textarea name="notes" maxLength={5000} rows="4" placeholder="Informações adicionais sobre o aluno…" defaultValue={client?.notes || ''} /></label>
      <div className="form-actions full-field"><Link className="button button-outline" to={client ? `/clientes/${client.id}/visaogeral` : '/clientes'}>Cancelar</Link><button disabled={busy} className="button button-primary button-dark">{busy ? 'Salvando…' : 'Salvar cliente'}</button></div>
    </form>
  </div></main>;
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
