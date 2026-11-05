import { useId, useState } from 'react';
import './evolutionChart.css';

const colors = ['#a21840', '#16835b', '#d87a23', '#546bbe', '#a355a1', '#277f92'];
const number = (value) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
const date = (day) => day.split('-').reverse().join('/');

export default function EvolutionChart({ title, series, unit }) {
  const id = useId();
  const [hidden, setHidden] = useState([]);
  const [selected, setSelected] = useState(null);
  const visible = series.filter((line) => !hidden.includes(line.id));
  const points = visible.flatMap((line) => line.points);
  const days = [...new Set(series.flatMap((line) => line.points.map((point) => point.day)))].sort();
  const values = points.map((point) => point.value);
  const low = values.length ? Math.min(...values) : 0;
  const high = values.length ? Math.max(...values) : 1;
  const padding = Math.max((high - low) * .15, high * .03, 1);
  const min = Math.max(0, low - padding);
  const max = high + padding;
  const firstDay = Date.parse(days[0]);
  const lastDay = Date.parse(days.at(-1));
  const x = (day) => firstDay === lastDay ? 340 : 64 + (Date.parse(day) - firstDay) / (lastDay - firstDay) * 548;
  const y = (value) => 206 - (value - min) / (max - min) * 174;
  const ticks = days.filter((_, index) => index === 0 || index === days.length - 1 || index % Math.max(1, Math.ceil(days.length / 4)) === 0);
  return <section className="evolution-chart" aria-labelledby={id}>
    <header><h3 id={id}>{title}</h3><span>{unit}</span></header>
    {!days.length ? <p className="catalog-empty">Nenhum registro neste período.</p> : <>
      <svg viewBox="0 0 640 250" role="group" aria-label={`${title}. Valores em ${unit}. Selecione um ponto para consultar a data e o valor.`}>
        {Array.from({ length: 5 }, (_, index) => {
          const value = min + (max - min) * index / 4;
          return <g key={index}><line x1="64" x2="612" y1={y(value)} y2={y(value)} className="evolution-grid" /><text x="54" y={y(value) + 4} textAnchor="end" className="evolution-axis">{number(value)}</text></g>;
        })}
        {ticks.map((day) => <text key={day} x={x(day)} y="232" textAnchor="middle" className="evolution-axis">{date(day).slice(0, 5)}</text>)}
        {visible.map((line) => {
          const color = colors[series.indexOf(line) % colors.length];
          return <g key={line.id}>
            <polyline points={line.points.map((point) => `${x(point.day)},${y(point.value)}`).join(' ')} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            {line.points.map((point) => <g key={point.day}>
              <circle cx={x(point.day)} cy={y(point.value)} r="5" fill={color} stroke="white" strokeWidth="2" />
              <circle cx={x(point.day)} cy={y(point.value)} r="12" fill="transparent" tabIndex="0" role="button" aria-label={`${line.name}, ${date(point.day)}: ${number(point.value)} ${unit}`} onFocus={() => setSelected({ ...point, name: line.name })} onMouseEnter={() => setSelected({ ...point, name: line.name })} onClick={() => setSelected({ ...point, name: line.name })} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected({ ...point, name: line.name }); } }}><title>{line.name}: {number(point.value)} {unit} · {date(point.day)}</title></circle>
            </g>)}
          </g>;
        })}
      </svg>
      <p className="evolution-point-info" aria-live="polite">{selected ? `${selected.name} · ${date(selected.day)} · ${number(selected.value)} ${unit}` : visible.length ? 'Selecione um ponto para ver os detalhes.' : 'Selecione uma medida abaixo para exibir.'}</p>
      <div className="evolution-legend" aria-label="Medidas exibidas">{series.map((line, index) => <button key={line.id} type="button" aria-pressed={!hidden.includes(line.id)} onClick={() => { setHidden((current) => current.includes(line.id) ? current.filter((key) => key !== line.id) : [...current, line.id]); setSelected(null); }}><i style={{ background: colors[index % colors.length] }} aria-hidden="true" />{line.name}</button>)}</div>
    </>}
  </section>;
}
