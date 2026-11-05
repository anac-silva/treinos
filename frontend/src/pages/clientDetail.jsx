import EvolutionChart from '../components/evolutionChart';
import { evolutionSeries } from '../lib/evolution';
import ClientPanel from '../components/clientPanel';
import ClientHeader from '../components/clientHeader';
import { useEffect, useState } from 'react';
import { allPages } from '../lib/api';
import { Link, useParams } from 'react-router-dom';
import ClientTabs from '../components/clientTabs';

import { useRemote } from '../lib/useRemote';

const date = (value) => value ? value.slice(0, 10).split('-').reverse().join('/') : '—';
function Corrections({ clientId, assessmentId }) {
  const { data, loading, error } = useRemote(`/clients/${clientId}/assessments/${assessmentId}/corrections`);
  return <>{loading && <p>Carregando auditoria…</p>}{error && <p role="alert">{error}</p>}{data && (!data.length ? <p>Sem correções.</p> : data.map((correction) => <div key={correction.id}><p>Versão {correction.version} · {date(correction.createdAt)} · {correction.reason}</p><details><summary>Antes e depois</summary><pre className="audit-json">{JSON.stringify({ antes: correction.before, depois: correction.after }, null, 2)}</pre></details></div>))}</>;
}
function History({ id }) {
  const [page, setPage] = useState(1);
  return <section className="settings-section"><h2>Histórico de avaliações</h2><HistoryPage key={id} id={id} page={page} setPage={setPage} /></section>;
}
function AssessmentHistoryItem({ assessments, clientId }) {
  const assessment = assessments[0];
  const [open, setOpen] = useState(false);
  const detailsId = `assessment-details-${assessment.id}`;
  return <article className="assessment-history-item">
    <div className="assessment-history-row">
      <time dateTime={assessment.assessedOn}>{date(assessment.assessedOn)}</time>
      <button type="button" className="button button-outline" aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen(!open)}>{open ? 'Ocultar detalhes' : 'Ver detalhes'}</button>
    </div>
    {open && <div id={detailsId} className="assessment-history-details">
      {assessments.map((assessment, index) => <div key={assessment.id} className="assessment-day-record">
      {assessments.length > 1 && <h3>Registro {index + 1}{assessment.createdAt && <> · {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(assessment.createdAt))}</>}</h3>}
      <dl className="assessment-summary"><div><dt>Peso</dt><dd>{assessment.weightKg} kg</dd></div><div><dt>Próxima avaliação</dt><dd>{date(assessment.nextAssessmentOn)}</dd></div></dl>
      {assessment.measurements.length > 0 && <dl className="assessment-values">{assessment.measurements.map((measurement) => <div key={measurement.id}><dt>{measurement.typeName}</dt><dd>{measurement.value} {measurement.unit}</dd></div>)}</dl>}
      {assessment.notes && <div className="assessment-history-notes"><h3>Observações</h3><p>{assessment.notes}</p></div>}
      <Link to={`/clientes/${clientId}/avaliacoes/${assessment.id}/corrigir`} className="button button-outline">Corrigir avaliação</Link>
      <details className="assessment-audit"><summary>Histórico de correções · versão {assessment.version}</summary><AuditToggle clientId={clientId} assessmentId={assessment.id} /></details>
      </div>)}
    </div>}
  </article>;
}
function HistoryPage({ id, page, setPage }) {
  const [{ items, loading, error }, setHistory] = useState({ items: [], loading: true, error: '' });
  useEffect(() => {
    const controller = new AbortController();
    allPages(`/clients/${id}/assessments`, controller.signal).then((items) => {
      if (!controller.signal.aborted) setHistory({ items, loading: false, error: '' });
    }).catch((error) => {
      if (!controller.signal.aborted) setHistory({ items: [], loading: false, error: error.message });
    });
    return () => controller.abort();
  }, [id]);
  if (loading) return <p role="status">Carregando avaliações…</p>;
  if (error) return <p role="alert">{error}</p>;
  const groups = Object.entries(items.reduce((days, assessment) => {
    const day = assessment.assessedOn.slice(0, 10);
    (days[day] ||= []).push(assessment);
    return days;
  }, {})).sort(([first], [second]) => second.localeCompare(first));
  const totalPages = Math.max(1, Math.ceil(groups.length / 10));
  const visibleDays = groups.slice((page - 1) * 10, page * 10);
  return <>
    {!items.length && <p className="catalog-empty">Nenhuma avaliação registrada.</p>}
    <div className="assessment-history-list">{visibleDays.map(([day, assessments]) => <AssessmentHistoryItem key={day} assessments={assessments} clientId={id} />)}</div>
    <footer className="table-footer assessment-history-footer"><span>{groups.length} {groups.length === 1 ? 'dia com avaliações' : 'dias com avaliações'} · Página {page} de {totalPages}</span><nav className="pagination" aria-label="Paginação das avaliações"><button type="button" className="button button-outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button><button type="button" className="button button-outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Próxima</button></nav></footer>
  </>;
}
function AuditToggle(props) {
  const [open, setOpen] = useState(false);
  return open ? <Corrections {...props} /> : <button type="button" onClick={() => setOpen(true)}>Carregar auditoria</button>;
}
function Evolution({ id }) {
  const [range, setRange] = useState('');
  function filter(event) {
    event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget));
    setRange(new URLSearchParams(Object.fromEntries(Object.entries(values).filter(([, value]) => value))).toString());
  }
  return <section className="settings-section"><h2>Evolução</h2><form className="catalog-form" onSubmit={filter}><label className="field">De<input name="from" type="date" /></label><label className="field">Até<input name="to" type="date" /></label><button className="button button-outline">Filtrar</button></form><EvolutionData key={range} id={id} range={range} /></section>;
}
function EvolutionData({ id, range }) {
  const weight = useRemote(`/clients/${id}/assessments/weight-evolution?${range}`);
  const measures = useRemote(`/clients/${id}/measurements?${range}`);
  const measurementSeries = evolutionSeries(measures.data?.items || []);
  const units = [...new Set(measurementSeries.map((line) => line.unit))];
  return <>
    {(weight.loading || measures.loading) && <p role="status">Carregando evolução…</p>}
    {(weight.error || measures.error) && <p role="alert">{weight.error || measures.error}</p>}
    <div className="evolution-charts">
      {weight.data && <EvolutionChart title="Evolução do peso" unit="kg" series={evolutionSeries(weight.data.items)} />}
      {measures.data && (units.length ? units.map((unit) => <EvolutionChart key={unit} title={units.length > 1 ? `Medidas corporais (${unit})` : 'Medidas corporais'} unit={unit} series={measurementSeries.filter((line) => line.unit === unit)} />) : <EvolutionChart title="Medidas corporais" unit="cm" series={[]} />)}
    </div>
  </>;
}
export default function ClientDetail({ mode }) {
  const { clientId } = useParams();
  const { data: client, loading, error } = useRemote(`/clients/${clientId}`);
  if (loading) return <main className="workspace" role="status">Carregando cliente…</main>;
  if (error) return <main className="workspace"><p role="alert">{error}</p><Link to="/clientes">Voltar para clientes</Link></main>;
  return <ClientPanel><ClientHeader client={client} /><ClientTabs />
    {mode === 'history' && <History id={clientId} />}
    {mode === 'overview' && <div className="section-heading"><h2>Evolução do aluno</h2><Link className="button button-primary" to={`/clientes/${clientId}/medidas`}>Nova medição</Link></div>}
    {mode === 'overview' && <Evolution id={clientId} />}
  </ClientPanel>;
}









