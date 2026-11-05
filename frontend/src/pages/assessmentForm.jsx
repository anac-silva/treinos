import BodyMeasurementGuide from '../components/bodyMeasurementGuide';
import ClientPanel from '../components/clientPanel';
import ClientHeader from '../components/clientHeader';
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
      nextAssessmentOn: values.nextAssessmentOn || null, notes: values.notes || null,
      measurements: types.filter((type) => values[`measure-${type.id}`] !== '').map((type) => ({ typeId: type.id, value: Number(values[`measure-${type.id}`]) })) };
    if (assessment) { body.reason = values.reason; body.expectedVersion = assessment.version; }
    try {
      await api(`/clients/${client.id}/assessments${assessment ? `/${assessment.id}/corrections` : ''}`, { method: 'POST', body });
      navigate(`/clientes/${client.id}/visaogeral`);
    } catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  return <ClientPanel><ClientHeader client={client} /><ClientTabs /><h2>{assessment ? 'Corrigir avaliação' : 'Nova medição'}</h2>
    {assessment && <p>Versão {assessment.version}. A correção será registrada no histórico de auditoria.</p>}
    {(error || catalogError) && <p role="alert" className="catalog-error">{error || catalogError}</p>}
    {loading ? <p role="status">Carregando catálogo…</p> : <form className="form-layout client-form-layout" onSubmit={submit} onInvalid={(event) => setError(event.target.name === 'weightKg' ? 'Informe um peso válido para salvar a avaliação.' : 'Confira os campos obrigatórios e os valores informados.')}>
      <label className="field">Data<input name="assessedOn" type="date" required defaultValue={assessment?.assessedOn?.slice(0, 10) || today} /></label>
      <label className="field">Peso (kg) *<input name="weightKg" type="number" min="0.001" max="9999.999" step="0.001" required defaultValue={assessment?.weightKg || ''} /></label>
      <label className="field">Próxima avaliação<input name="nextAssessmentOn" type="date" defaultValue={assessment?.nextAssessmentOn?.slice(0, 10) || ''} /></label>
      <section className="full-field assessment-measurements" aria-labelledby="assessment-measurements-title">
        <BodyMeasurementGuide sex={client.sex} />
        <div className="assessment-measurement-list">
          <h3 id="assessment-measurements-title">Medidas corporais</h3>
          {types.map((type) => <label className="field assessment-measurement-field" key={type.id}><span>{type.name} ({type.unit})</span><input name={`measure-${type.id}`} type="number" min="0" max="9999999.999" step="0.001" placeholder="—" defaultValue={assessment?.measurements.find((m) => m.typeId === type.id)?.value ?? ''} /></label>)}
          {!types.length && <p className="catalog-empty">Sem tipos de medição cadastrados. Você pode registrar somente o peso ou cadastrar tipos em Configurações.</p>}
        </div>
      </section>
      <label className="field full-field">Observações<textarea name="notes" maxLength={5000} defaultValue={assessment?.notes || ''} /></label>
      {assessment && <label className="field full-field">Motivo da correção<textarea name="reason" required maxLength={500} /></label>}
      <div className="form-actions full-field"><Link className="button button-outline" to={`/clientes/${client.id}/visaogeral`}>Cancelar</Link><button disabled={busy || Boolean(catalogError)} className="button button-primary">{busy ? 'Salvando…' : assessment ? 'Salvar correção' : 'Salvar medição'}</button></div>
    </form>}
  </ClientPanel>;
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







