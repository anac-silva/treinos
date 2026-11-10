import BodyMeasurementGuide from '../components/bodyMeasurementGuide';
import ClientPanel from '../components/clientPanel';
import ClientHeader from '../components/clientHeader';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ClientTabs from '../components/clientTabs';
import { useCatalog } from '../contexts/catalogContext';
import { api } from '../lib/api';
import { useRemote } from '../lib/useRemote';
import { useAuth } from '../contexts/authContext';
import { assessmentInterval, nextAssessmentDate } from '../lib/assessmentSchedule';
import { assessmentDraftKey, readAssessmentDraft, writeAssessmentDraft, removeAssessmentDraft, clearBodyMeasurements } from '../lib/assessmentDraft';

function draftStorage() {
  try { return window.localStorage; } catch { return null; }
}

function AssessmentEditor({ client, assessment, previous, previousLoading, previousError }) {
  const { measurements, loading, error: catalogError } = useCatalog();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const available = measurements.filter((type) => type.active);
  const types = assessment ? [...assessment.measurements.map((m) => ({ id: m.typeId, name: m.typeName, unit: m.unit })), ...available.filter((t) => !assessment.measurements.some((m) => m.typeId === t.id))] : available;
  const parts = Object.fromEntries(new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  const today = `${parts.year}-${parts.month}-${parts.day}`;
  const draftKey = assessmentDraftKey(user.id, client.id, assessment?.id, assessment?.version);
  const [draft, setDraft] = useState(() => {
    const restored = readAssessmentDraft(draftStorage(), draftKey);
    return { values: {
      assessedOn: assessment?.assessedOn?.slice(0, 10) || today,
      weightKg: assessment?.weightKg?.toString() || '',
      nextAssessmentOn: assessment?.nextAssessmentOn?.slice(0, 10) || '',
      notes: assessment?.notes || '', reason: '',
      ...Object.fromEntries((assessment?.measurements || []).map((m) => [`measure-${m.typeId}`, String(m.value)])),
      ...restored,
    }, message: restored ? 'Rascunho recuperado. Continue de onde parou.' : '', failed: false };
  });
  function persist(values, message = 'Rascunho salvo neste navegador.') {
    const saved = writeAssessmentDraft(draftStorage(), draftKey, values);
    setDraft({ values, message: saved ? message : 'Não foi possível salvar o rascunho neste navegador. Mantenha esta tela aberta até salvar a medição.', failed: !saved });
  }
  function change(event) {
    const { name, value } = event.target;
    if (name === 'assessmentDays') {
      persist({ ...draft.values, nextAssessmentOn: nextAssessmentDate(draft.values.assessedOn, value) });
      return;
    }
    if (name === 'assessedOn') {
      const days = assessmentInterval(draft.values.assessedOn, draft.values.nextAssessmentOn);
      persist({ ...draft.values, assessedOn: value, nextAssessmentOn: nextAssessmentDate(value, days) });
      return;
    }
    if (name) persist({ ...draft.values, [name]: value });
  }
  function clearMeasurements() {
    const values = clearBodyMeasurements(draft.values);
    for (const type of types) values[`measure-${type.id}`] = '';
    persist(values, 'Medidas corporais limpas. Rascunho atualizado.');
  }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const body = { assessedOn: values.assessedOn, weightKg: Number(values.weightKg),
      nextAssessmentOn: values.nextAssessmentOn || null, notes: values.notes || null,
      measurements: types.filter((type) => values[`measure-${type.id}`] !== '').map((type) => ({ typeId: type.id, value: Number(values[`measure-${type.id}`]) })) };
    if (assessment) { body.reason = values.reason; body.expectedVersion = assessment.version; }
    try {
      await api(`/clients/${client.id}/assessments${assessment ? `/${assessment.id}/corrections` : ''}`, { method: 'POST', body });
      removeAssessmentDraft(draftStorage(), draftKey);
      navigate(`/clientes/${client.id}/visaogeral`);
    } catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  return <ClientPanel className="assessment-editor-page"><ClientHeader client={client} /><ClientTabs /><div className="section-heading"><h2>{assessment ? 'Corrigir avaliação' : 'Nova medição'}</h2><Link className="button button-outline" to={`/clientes/${client.id}/historico`}>Histórico de avaliações</Link></div>
    {assessment && <p>Versão {assessment.version}. A correção será registrada no histórico de auditoria.</p>}
    {(error || catalogError) && <p role="alert" className="catalog-error">{error || catalogError}</p>}
    {draft.message && <p className={draft.failed ? 'catalog-error' : 'assessment-draft-status'} role={draft.failed ? 'alert' : 'status'}>{draft.message}</p>}
    {loading ? <p role="status">Carregando catálogo…</p> : <form className="form-layout client-form-layout" onSubmit={submit} onInvalid={(event) => setError(event.target.name === 'weightKg' ? 'Informe um peso válido para salvar a avaliação.' : 'Confira os campos obrigatórios e os valores informados.')}>
      <label className="field">Data<input name="assessedOn" type="date" required value={draft.values.assessedOn} onChange={change} /></label>
      <label className="field">Próxima avaliação em (dias)<input name="assessmentDays" type="number" min="0" max="3650" step="1" placeholder="Ex.: 90" value={assessmentInterval(draft.values.assessedOn, draft.values.nextAssessmentOn)} onChange={change} /></label>
      <label className="field">Próxima avaliação (prevista)<input name="nextAssessmentOn" type="date" value={draft.values.nextAssessmentOn} onChange={change} title="Gera uma previsão na agenda, que poderá ser alterada, cancelada ou confirmada." /></label>
      <section className="full-field assessment-measurements" aria-labelledby="assessment-measurements-title">
        <div className="assessment-guide-column">
          <BodyMeasurementGuide sex={client.sex} />
          <label className="field assessment-observations">Observações<textarea name="notes" maxLength={5000} value={draft.values.notes} onChange={change} /></label>
        </div>
        <div className="assessment-measurement-list">
          <div className="assessment-measurement-heading"><h3 id="assessment-measurements-title">Medidas corporais</h3><button type="button" className="button button-outline" disabled={busy || !types.length} onClick={clearMeasurements}>Limpar medidas corporais</button></div>
          {!assessment && <>
            {previousLoading && <p role="status">Carregando última medição…</p>}
            {previousError && <p role="alert" className="catalog-error">Não foi possível carregar a última medição: {previousError}</p>}
            {!previousLoading && !previousError && <p className="assessment-comparison-date">{previous ? `Última medição: ${previous.assessedOn.slice(0, 10).split('-').reverse().join('/')}` : 'Nenhuma medição anterior registrada.'}</p>}
            <div className="assessment-measurement-columns" aria-hidden="true"><span>Medida</span><span>Anterior</span><span>Nova medida</span><span>Diferença</span></div>
          </>}
          {[{ id: 'weightKg', name: 'Peso', unit: 'kg', isWeight: true }, ...types].map((type) => {
            const fieldName = type.isWeight ? 'weightKg' : `measure-${type.id}`;
            const last = type.isWeight ? (previous?.weightKg != null ? { value: previous.weightKg, unit: 'kg' } : null) : previous?.measurements.find((m) => m.typeId === type.id);
            const current = draft.values[fieldName];
            const comparable = !previousLoading && !previousError && last && last.unit === type.unit && current != null && current !== '' && Number.isFinite(Number(current));
            const difference = comparable ? Number((Number(current) - Number(last.value)).toFixed(3)) : null;
            return <div className={`field assessment-measurement-field${!assessment ? ' assessment-measurement-comparison' : ''}`} key={type.id}>
              <label htmlFor={`measure-${type.id}`}>{type.name} ({type.unit}){type.isWeight ? ' *' : ''}</label>
              {!assessment && <span className="assessment-previous-value" aria-label={`Última medição de ${type.name}`}>{previousLoading ? '…' : last ? `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(Number(last.value))} ${last.unit}` : '—'}</span>}
              <input id={`measure-${type.id}`} name={fieldName} type="number" min={type.isWeight ? '0.001' : '0'} max={type.isWeight ? '9999.999' : '9999999.999'} step="0.001" required={Boolean(type.isWeight)} placeholder="—" value={current ?? ''} onChange={change} />
              {!assessment && <output className="assessment-measurement-difference" htmlFor={`measure-${type.id}`} aria-label={`Diferença de ${type.name}`}>{difference == null ? '—' : `${difference > 0 ? '+' : ''}${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(difference)} ${type.unit}`}</output>}
            </div>;
          })}
          {!types.length && <p className="catalog-empty">Sem tipos de medição cadastrados. Você pode registrar somente o peso ou cadastrar tipos em Configurações.</p>}
        </div>
      </section>
      {assessment && <label className="field full-field">Motivo da correção<textarea name="reason" required maxLength={500} value={draft.values.reason} onChange={change} /></label>}
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
function NewAssessment({ client }) {
  const { data, loading, error } = useRemote(`/clients/${client.id}/assessments?page=1&pageSize=1`);
  return <AssessmentEditor client={client} previous={data?.items[0]} previousLoading={loading} previousError={error} />;
}
export default function AssessmentForm() {
  const { clientId, assessmentId } = useParams();
  const { data, loading, error } = useRemote(`/clients/${clientId}`);
  if (loading) return <main className="workspace" role="status">Carregando aluno…</main>;
  if (error) return <main className="workspace"><p role="alert">{error}</p></main>;
  return assessmentId ? <Correction client={data} id={assessmentId} /> : <NewAssessment key={clientId} client={data} />;
}
