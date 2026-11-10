import { FiAlertTriangle, FiCalendar, FiCheckCircle, FiInfo, FiLayers, FiTarget } from 'react-icons/fi';
import { GiWeightLiftingUp } from 'react-icons/gi';
import { useRemote } from '../lib/useRemote';
import { blockLetter } from '../lib/workoutSheets';
import './studentOverviewPanels.css';

const dateLabel = (value) => value?.slice(0, 10).split('-').reverse().join('/') || 'Não agendada';

export default function StudentOverviewPanels({ client }) {
  const sheets = useRemote('/workout-sheets?' + new URLSearchParams({ clientId: client.id, isActive: 'true', pageSize: '1' }));
  const assessments = useRemote(`/clients/${client.id}/assessments?pageSize=1&page=1`);
  const sheet = sheets.data?.items[0];
  const assessment = assessments.data?.items[0];
  const next = assessment?.nextAssessmentOn;
  const rows = [
    [FiTarget, 'Objetivo', client.goal || 'Não informado'],
    [FiLayers, 'Divisão', sheet?.blocks?.map((_, index) => blockLetter(index)).join('/') || 'Sem ficha atual'],
    [FiCalendar, 'Próxima reavaliação', dateLabel(next)],
  ];
  const loading = sheets.loading || assessments.loading;
  const error = sheets.error || assessments.error;
  const alerts = [];
  if (!loading && !error) {
    alerts.push(sheet ? [FiCheckCircle, 'success', 'Ficha de treino atual disponível para acompanhamento.'] : [FiInfo, 'info', 'O aluno ainda não tem uma ficha de treino atual.']);
    if (!assessment) alerts.push([FiInfo, 'info', 'Registre a primeira avaliação para acompanhar a evolução.']);
    if (!client.goal) alerts.push([FiTarget, 'info', 'Defina o objetivo do aluno para orientar o acompanhamento.']);
  }
  return <div className="student-overview-panels">
    <section className="student-overview-panel" aria-labelledby="workout-summary-title">
      <h2 id="workout-summary-title"><GiWeightLiftingUp aria-hidden="true" />Resumo do treino atual</h2>
      {loading ? <p role="status">Carregando resumo…</p> : error ? <p role="alert">Não foi possível carregar o resumo: {error}</p> : <dl className="student-workout-summary">{rows.map(([Icon, label, value]) => <div key={label}><dt><Icon aria-hidden="true" />{label}</dt><dd>{value}</dd></div>)}</dl>}
    </section>
    <section className="student-overview-panel student-attention-panel" aria-labelledby="student-attention-title">
      <h2 id="student-attention-title"><FiAlertTriangle aria-hidden="true" />Pontos de atenção</h2>
      {loading ? <p role="status">Carregando pontos de atenção…</p> : error ? <p role="alert">Não foi possível carregar os pontos de atenção.</p> : <ul className="student-attention-list">{alerts.map(([Icon, tone, text]) => <li key={text} className={tone}><Icon aria-hidden="true" /><span>{text}</span></li>)}</ul>}
    </section>
  </div>;
}
