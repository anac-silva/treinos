import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCollection } from '../lib/useCollection';
import { businessDateKey as dateKey, businessTimeZone as timeZone, businessDayBounds } from '../lib/businessDate';
import { appointmentStatusLabels as statusLabels, appointmentStatusClasses as statusClasses } from './agendamentos/appointmentStatus';
import { FiArrowRight, FiCalendar, FiUsers, FiZap } from 'react-icons/fi';
import { useAuth } from '../contexts/authContext';
import { useRemote } from '../lib/useRemote';

function shiftDay(day, offset) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
function appointmentsPath(from, to, pageSize = 1) {
  return '/appointments?' + new URLSearchParams({ from: businessDayBounds(from), to: businessDayBounds(to, true), includePending: 'false', ...(pageSize ? { pageSize: String(pageSize) } : {}) });
}
function useWeeklyAppointments(from, to) {
  const result = useCollection(appointmentsPath(from, to, null));
  return { ...result, data: result.data ? { items: result.data, total: result.data.length } : null };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [now] = useState(() => new Date());
  const today = dateKey(now);
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  const weekStart = shiftDay(today, -((weekday + 6) % 7));
  const weekEnd = shiftDay(weekStart, 6);
  const clients = useRemote('/clients?pageSize=1&status=ACTIVE');
  const week = useWeeklyAppointments(weekStart, weekEnd);
  const daily = useRemote(appointmentsPath(today, today));
  const cards = [
    { label: 'Alunos ativos', result: clients, icon: <FiUsers />, to: '/clientes' },
    { label: 'Agendamentos da semana', result: week, icon: <FiCalendar />, to: '/agendamentos' },
    { label: 'Atendimentos de hoje', result: daily, icon: <FiZap />, to: '/agendamentos' },
  ];
  const groups = (week.data?.items || []).reduce((days, appointment) => {
    const key = dateKey(new Date(appointment.startsAt));
    (days[key] ||= []).push(appointment);
    return days;
  }, {});
  const weeklyCounts = (week.data?.items || []).reduce((counts, appointment) => {
    counts[appointment.status] = (counts[appointment.status] || 0) + 1;
    return counts;
  }, {});
  return <main className="workspace dashboard-page">
    <header className="page-heading home-heading">
      <div><h1>Olá, {user.name.split(' ')[0]}!</h1><p>Disciplina hoje, resultados sempre.</p></div>
      <div className="dashboard-date"><div className="date-display"><strong>{new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone }).format(now)}</strong><span>{new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone }).format(now)}</span></div><FiCalendar aria-hidden="true" /></div>
    </header>
    <section className="stats-grid" aria-label="Resumo dos atendimentos">
      {cards.map(({ label, result, icon, to }) => <Link className="stat-card dashboard-stat" to={to} key={label} aria-label={`${label}: ${result.loading ? 'carregando' : result.data?.total ?? 'indisponível'}`}>
        <div><strong>{result.loading ? '…' : result.data?.total ?? '—'}</strong><span>{label}</span></div><i aria-hidden="true">{icon}</i>
        {result === week && <div className="dashboard-week-summary" aria-label="Situação dos agendamentos da semana">
          {[['CANCELLED', 'Cancelados'], ['COMPLETED', 'Realizados'], ['SCHEDULED', 'A realizar']].map(([status, title]) => <span key={status}>{title} <b>{week.loading ? '…' : week.error ? '—' : weeklyCounts[status] || 0}</b></span>)}
        </div>}
      </Link>)}
    </section>
    {cards.filter(({ result }) => result.error).map(({ label, result }) => <p key={label} role="alert" className="catalog-error">{label}: {result.error}</p>)}
    <section aria-labelledby="dashboard-agenda-title">
      <div className="section-heading"><h2 id="dashboard-agenda-title">Agenda da semana</h2><Link className="text-action" to="/agendamentos">Ver agenda completa <FiArrowRight aria-hidden="true" /></Link></div>
      {week.loading && <p role="status">Carregando agenda…</p>}
      {week.data && !Object.keys(groups).length && <p className="catalog-empty">Nenhum agendamento de hoje até o fim da semana.</p>}
      {Object.entries(groups).map(([day, appointments]) => <div className="dashboard-day" key={day}>
        <h3 className="day-label">{day === today ? 'Hoje' : day === shiftDay(today, 1) ? 'Amanhã' : new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone }).format(new Date(`${day}T12:00:00-03:00`))} · {day.slice(8)}/{day.slice(5, 7)}</h3>
        <div className="appointment-row dashboard-appointment dashboard-agenda-header"><span>Horário</span><span>Aluno</span><span>Motivo</span><span>Status</span></div>
        {appointments.map((appointment) => <div className="appointment-row dashboard-appointment" key={appointment.id}>
          <time dateTime={appointment.startsAt}>{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone }).format(new Date(appointment.startsAt))}</time>
          {appointment.clientId ? <Link className="dashboard-client" to={`/clientes/${appointment.clientId}/visaogeral`}>{appointment.client.name}</Link> : <strong>{appointment.guestName}</strong>}
          <span className="appointment-type">{appointment.type}</span>
          <span className={`status ${statusClasses[appointment.status]}`}>{statusLabels[appointment.status]}</span>
        </div>)}
      </div>)}
      {week.data?.total > week.data?.items.length && <Link className="text-action dashboard-more" to="/agendamentos">Ver todos os {week.data.total} agendamentos <FiArrowRight aria-hidden="true" /></Link>}
    </section>
  </main>;
}
