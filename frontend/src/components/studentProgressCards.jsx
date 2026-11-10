import { FiArrowDownRight, FiArrowUpRight, FiTrendingDown } from 'react-icons/fi';
import { GiWeightScale } from 'react-icons/gi';
import { useRemote } from '../lib/useRemote';
import { evolutionSeries } from '../lib/evolution';
import { currentWeightPoints } from '../lib/currentWeight';
import './studentProgressCards.css';

const number = (value) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);
function WaistIcon(props) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="7" rx="8" ry="3" /><path d="M4 7v9c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 11c0 1.7 3.6 3 8 3s8-1.3 8-3M8 14v2m4-2v3m4-3v2" /></svg>;
}
function HipIcon(props) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3c1 4-3 7-3 11 0 3 2 5 2 7m11-18c-1 4 3 7 3 11 0 3-2 5-2 7M5 11c4 2 10 2 14 0M12 14v7M8 17l4-3 4 3" /><path d="M3 14h5m8 0h5" /></svg>;
}
function change(points = []) {
  if (points.length < 2) return null;
  const first = points[0].value;
  const delta = points.at(-1).value - first;
  return { delta, percent: first > 0 ? delta / first * 100 : null };
}
function Card({ label, Icon, value, unit, variation, loading, children, besideValue }) {
  const direction = variation?.delta < 0 ? 'decrease' : variation?.delta > 0 ? 'increase' : 'stable';
  const Arrow = direction === 'increase' ? FiArrowUpRight : FiArrowDownRight;
  return <article className={`student-progress-card ${variation ? direction : ''}`} aria-label={label}>
    <span className="student-progress-icon"><Icon aria-hidden="true" /></span>
    <div><h3>{label}</h3><div className="student-progress-value-row"><p className="student-progress-value">{loading ? '…' : value == null ? '—' : `${number(value)} ${unit}`}</p>{!loading && besideValue}</div>
      {!loading && variation?.percent != null && <span className="student-progress-badge"><Arrow aria-hidden="true" />{variation.percent > 0 ? '+' : ''}{number(variation.percent)}%</span>}
      {!loading && children}
    </div>
  </article>;
}
export default function StudentProgressCards({ id }) {
  const weight = useRemote(`/clients/${id}/assessments/weight-evolution`);
  const measures = useRemote(`/clients/${id}/measurements`);
  const points = currentWeightPoints(weight.data?.items || []);
  const series = evolutionSeries(measures.data?.items || []);
  const measureChange = (name) => change(series.find((line) => line.name.trim().toLocaleLowerCase('pt-BR') === name && line.unit === 'cm')?.points);
  const totalWeightChange = change(points);
  const weightChange = change(points.slice(-2));
  const waistChange = measureChange('cintura');
  const hipChange = measureChange('quadril');
  return <section className="student-progress" aria-label="Resumo da evolução do aluno">
    <div className="student-progress-grid">
      <Card label="Peso atual" Icon={GiWeightScale} value={points.at(-1)?.value} unit="kg" loading={weight.loading} besideValue={totalWeightChange && <span className={`student-weight-total ${totalWeightChange.delta > 0 ? 'increase' : ''}`} title="Variação total desde a primeira avaliação">{totalWeightChange.delta > 0 ? <FiArrowUpRight aria-hidden="true" /> : <FiArrowDownRight aria-hidden="true" />}<span>{number(Math.abs(totalWeightChange.delta))} kg<small>{totalWeightChange.delta > 0 ? 'ganhos no total' : totalWeightChange.delta < 0 ? 'perdidos no total' : 'de variação total'}</small></span></span>}>
        {points.length > 0 && <div className="student-progress-initial"><span>Peso inicial: {number(points[0].value)} kg</span>
        </div>}
      </Card>
      <Card label={weightChange?.delta > 0 ? 'Peso ganho' : 'Peso perdido'} Icon={FiTrendingDown} value={weightChange?.delta} unit="kg" variation={weightChange} loading={weight.loading}>
        <p className="student-progress-detail">{points.length < 2 ? 'Aguardando segunda avaliação' : 'Desde a avaliação anterior'}</p>
      </Card>
      <Card label="Cintura" Icon={WaistIcon} value={waistChange?.delta} unit="cm" variation={waistChange} loading={measures.loading} />
      <Card label="Quadril" Icon={HipIcon} value={hipChange?.delta} unit="cm" variation={hipChange} loading={measures.loading} />
    </div>
    {(weight.error || measures.error) && <p role="alert" className="student-progress-note">Não foi possível carregar o resumo: {weight.error || measures.error}</p>}
    <p className="student-progress-note">Peso perdido ou ganho: comparação entre as duas últimas avaliações. Cintura e quadril: variações desde o primeiro registro.</p>
  </section>;
}
