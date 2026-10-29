import ClientPanel from '../components/clientPanel';
import { FiArrowLeft } from 'react-icons/fi';
import { useState } from 'react';
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
  return <section className="settings-section"><h2>Histórico de avaliações</h2><HistoryPage key={page} id={id} page={page} setPage={setPage} /></section>;
}
function HistoryPage({ id, page, setPage }) {
  const { data, loading, error } = useRemote(`/clients/${id}/assessments?page=${page}&pageSize=10`);
  if (loading) return <p role="status">Carregando avaliações…</p>;
  if (error) return <p role="alert">{error}</p>;
  return <>{!data.items.length && <p>Nenhuma avaliação registrada.</p>}{data.items.map((assessment) => <article key={assessment.id} className="assessment-card"><div className="section-heading"><h3>{date(assessment.assessedOn)} · {assessment.weightKg} kg</h3><Link to={`/clientes/${id}/avaliacoes/${assessment.id}/corrigir`} className="button button-outline">Corrigir</Link></div>
    <p>Altura: {assessment.heightCm ?? '—'} cm · Gordura: {assessment.bodyFatPercent ?? '—'}% · Próxima avaliação: {date(assessment.nextAssessmentOn)}</p>
    {assessment.notes && <p>{assessment.notes}</p>}
    <ul>{assessment.measurements.map((m) => <li key={m.id}>{m.typeName}: {m.value} {m.unit}</li>)}</ul>
    <details><summary>Correções e auditoria · versão {assessment.version}</summary><AuditToggle clientId={id} assessmentId={assessment.id} /></details>
  </article>)}<div className="pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button><span>Página {page}</span><button disabled={page * data.pageSize >= data.total} onClick={() => setPage(page + 1)}>Próxima</button></div></>;
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
  return <>{(weight.loading || measures.loading) && <p role="status">Carregando evolução…</p>}{(weight.error || measures.error) && <p role="alert">{weight.error || measures.error}</p>}
    {weight.data && <><h3>Peso</h3><div className="table-wrap"><table className="data-table"><thead><tr><th>Data</th><th>Peso (kg)</th></tr></thead><tbody>{weight.data.items.map((m) => <tr key={m.assessmentId}><td>{date(m.assessedOn)}</td><td>{m.value}</td></tr>)}</tbody></table></div>{!weight.data.items.length && <p>Sem registros de peso.</p>}</>}
    {measures.data && <><h3>Medidas corporais</h3><div className="table-wrap"><table className="data-table"><thead><tr><th>Data</th><th>Medição</th><th>Valor</th></tr></thead><tbody>{measures.data.items.map((m) => <tr key={`${m.assessmentId}-${m.typeId}`}><td>{date(m.assessedOn)}</td><td>{m.name}</td><td>{m.value} {m.unit}</td></tr>)}</tbody></table></div>{!measures.data.items.length && <p>Sem medidas registradas.</p>}</>}
  </>;
}
export default function ClientDetail({ mode }) {
  const { clientId } = useParams();
  const { data: client, loading, error } = useRemote(`/clients/${clientId}`);
  if (loading) return <main className="workspace" role="status">Carregando cliente…</main>;
  if (error) return <main className="workspace"><p role="alert">{error}</p><Link to="/clientes">Voltar para clientes</Link></main>;
  return <ClientPanel><Link to="/clientes" className="back-link"><FiArrowLeft aria-hidden="true" />Voltar para Clientes</Link><header className="page-heading new-client-heading"><div><h1>{client.name}</h1><p>{client.age != null ? `${client.age} anos · ` : ''}{client.goal || 'Objetivo não informado'} · {client.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</p></div><Link to={`/clientes/${clientId}/editar`} className="button button-outline">Editar cliente</Link></header><ClientTabs />
    {mode === 'history' && <History id={clientId} />}
    {mode === 'measurements' && <div className="section-heading"><h2>Medidas e evolução</h2><Link className="button button-primary" to={`/clientes/${clientId}/novaavaliacao`}>Nova avaliação de medidas</Link></div>}
    {mode !== 'history' && <Evolution id={clientId} />}
  </ClientPanel>;
}




