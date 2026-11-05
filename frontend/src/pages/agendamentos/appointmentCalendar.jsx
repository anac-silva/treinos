import { useState } from 'react';
import { useCollection } from '../../lib/useCollection';
import { businessDateKey as keyOf, businessDayLabel as label, businessDayBounds, shiftMonth } from '../../lib/businessDate';
import DayDialog from './dayDialog';

export default function AppointmentCalendar({ revision, onEdit, onCancel, onConfirm, busyId, confirmError, onClearError }) {
  const [month, setMonth] = useState(() => keyOf(new Date()).slice(0, 7));
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [year, number] = month.split('-').map(Number);
  const last = new Date(year, number, 0).getDate();
  const params = new URLSearchParams({ from: businessDayBounds(month + '-01'), to: businessDayBounds(month + '-' + last, true), ...(status ? { status } : {}) });
  const { data, loading, error } = useCollection('/appointments?' + params, revision);
  const items = data || [];
  const days = items.reduce((groups, item) => { (groups[keyOf(item.startsAt)] ||= []).push(item); return groups; }, {});
  const offset = (new Date(year, number - 1, 1).getDay() + 6) % 7;
  const cells = Math.ceil((offset + last) / 7) * 7;
  function move(delta) { setMonth(shiftMonth(month, delta)); setSelected(null); onClearError(); }
  return <>
    <div className="toolbar appointment-filters calendar-toolbar">
      <button type="button" className="button button-outline" aria-label="Mês anterior" onClick={() => move(-1)}>‹</button>
      <label className="field">Mês<input type="month" required value={month} onChange={(event) => { if (event.target.value) { setMonth(event.target.value); setSelected(null); } }} /></label>
      <button type="button" className="button button-outline" aria-label="Próximo mês" onClick={() => move(1)}>›</button>
      <button type="button" className="button button-outline" onClick={() => { setMonth(keyOf(new Date()).slice(0, 7)); setSelected(null); }}>Mês atual</button>
      <label className="field">Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos</option><option value="PENDING_CONFIRMATION">Pendentes de confirmação</option><option value="SCHEDULED">Agendados</option><option value="COMPLETED">Realizados</option><option value="CANCELLED">Cancelados</option></select></label>
    </div>
    <section className="settings-section monthly-calendar" aria-label="Calendário de agendamentos">
      {error && <p className="catalog-error" role="alert">{error}</p>}
      {loading && <p role="status">Carregando agendamentos…</p>}
      <div className="calendar-grid" style={{ '--calendar-weeks': cells / 7 }} aria-busy={loading}>
        {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((day) => <div className="calendar-weekday" key={day}>{day}</div>)}
        {Array.from({ length: cells }, (_, index) => {
          const dayNumber = index - offset + 1;
          if (dayNumber < 1 || dayNumber > last) return <div className="calendar-blank" key={index} />;
          const day = month + '-' + String(dayNumber).padStart(2, '0');
          const items = days[day] || [];
          const count = new Set(items.map((item) => item.clientId || item.guestPhone || item.guestName)).size;
          return <button type="button" key={index} className={'calendar-day ' + (items.length ? 'has-appointments ' : '') + (day === keyOf(new Date()) ? 'is-today' : '')} disabled={loading || Boolean(error)} aria-label={label(day) + ', ' + count + ' aluno(s), ' + items.length + ' agendamento(s)'} aria-current={day === keyOf(new Date()) ? 'date' : undefined} onClick={() => { onClearError(); setSelected(day); }}>
            <strong>{dayNumber}</strong>{items.length > 0 && <span>{count} {count === 1 ? 'aluno' : 'alunos'}<small>{items.length} {items.length === 1 ? 'agendamento' : 'agendamentos'}</small></span>}
          </button>;
        })}
      </div>
      {selected && <DayDialog error={confirmError} day={selected} items={days[selected] || []} onClose={() => setSelected(null)} onEdit={onEdit} onCancel={onCancel} onConfirm={onConfirm} busyId={busyId} />}
    </section>
  </>;
}
