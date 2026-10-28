import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ClientTabs from '../components/clientTabs';
import { useCatalog } from '../contexts/catalogContext';
import { api } from '../lib/api';
import { useRemote } from '../lib/useRemote';

function AssessmentEditor({ client, assessment }) {
  const { measurements, loading, error: catalogError } = useCatalog();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const available = measurements.filter((type) => type.active);
  const types = assessment ? [...assessment.measurements.map((m) => ({ id: m.typeId, name: m.typeName, unit: m.unit })), ...available.filter((t) => !assessment.measurements.some((m) => m.typeId === t.id))] : available;
  const parts = Object.fromEntries(new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  const today = `${parts.year}-${parts.month}-${parts.day}`;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const body = { assessedOn: values.assessedOn, weightKg: Number(values.weightKg),
      heightCm: values.heightCm ? Number(values.heightCm) : null,
      bodyFatPercent: values.bodyFatPercent ? Number(values.bodyFatPercent) : null,
      nextAssessmentOn: values.nextAssessmentOn || null, notes: values.notes || null,
      measurements: types.filter((type) => values[`measure-${type.id}`] !== '').map((type) => ({ typeId: type.id, value: Number(values[`measure-${type.id}`]) })) };
    if (assessment) { body.reason = values.reason; body.expectedVersion = assessment.version; }
    try {
      await api(`/clients/${client.id}/assessments${assessment ? `/${assessment.id}/corrections` : ''}`, { method: 'POST', body });
      navigate(`/clientes/${client.id}/visaogeral`);
    } catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  return <main className="workspace"><h1>{client.name}</h1><ClientTabs /><h2>{assessment ? 'Corrigir avaliação' : 'Nova avaliação'}</h2>
    {assessment && <p>Versão {assessment.version}. A correção será registrada no histórico de auditoria.</p>}
    {(error || catalogError) && <p role="alert" className="catalog-error">{error || catalogError}</p>}
    {loading ? <p role="status">Carregando catálogo…</p> : <form className="form-layout" onSubmit={submit}>
      <label className="field">Data<input name="assessedOn" type="date" required defaultValue={assessment?.assessedOn || today} /></label>
      <label className="field">Peso (kg)<input name="weightKg" type="number" min="0.001" max="9999.999" step="0.001" required defaultValue={assessment?.weightKg || ''} /></label>
      <label className="field">Altura (cm)<input name="heightCm" type="number" min="0.01" max="9999.99" step="0.01" defaultValue={assessment?.heightCm || ''} /></label>
      <label className="field">Gordura corporal (%)<input name="bodyFatPercent" type="number" min="0" max="100" step="0.01" defaultValue={assessment?.bodyFatPercent ?? ''} /></label>
      <label className="field">Próxima avaliação<input name="nextAssessmentOn" type="date" defaultValue={assessment?.nextAssessmentOn || ''} /></label>
      {types.map((type) => <label className="field" key={type.id}>{type.name} ({type.unit})<input name={`measure-${type.id}`} type="number" min="0" max="9999999.999" step="0.001" defaultValue={assessment?.measurements.find((m) => m.typeId === type.id)?.value ?? ''} /></label>)}
      {!types.length && <p>Sem tipos de medição cadastrados. Você pode registrar somente o peso ou cadastrar tipos em Configurações.</p>}
      <label className="field full-field">Observações<textarea name="notes" maxLength={5000} defaultValue={assessment?.notes || ''} /></label>
      {assessment && <label className="field full-field">Motivo da correção<textarea name="reason" required maxLength={500} /></label>}
      <div className="form-actions full-field"><Link className="button button-outline" to={`/clientes/${client.id}/visaogeral`}>Cancelar</Link><button disabled={busy || Boolean(catalogError)} className="button button-primary">{busy ? 'Salvando…' : assessment ? 'Salvar correção' : 'Salvar avaliação'}</button></div>
    </form>}
  </main>;
}
function Correction({ client, id }) {
  const { data, loading, error } = useRemote(`/clients/${client.id}/assessments/${id}`);
  if (loading) return <p role="status">Carregando avaliação…</p>;
  if (error) return <p role="alert">{error}</p>;
  return <AssessmentEditor client={client} assessment={data} />;
}
export default function AssessmentForm() {
  const { clientId, assessmentId } = useParams();
  const { data, loading, error } = useRemote(`/clients/${clientId}`);
  if (loading) return <main className="workspace" role="status">Carregando cliente…</main>;
  if (error) return <main className="workspace"><p role="alert">{error}</p></main>;
  return assessmentId ? <Correction client={data} id={assessmentId} /> : <AssessmentEditor client={data} />;
}
