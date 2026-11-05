import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCalendar, FiUsers, FiZap } from 'react-icons/fi';
import { useAuth } from '../contexts/authContext';
import { useRemote } from '../lib/useRemote';

const timeZone = 'America/Sao_Paulo';
const dateKey = (date) => new Intl.DateTimeFormat('sv-SE', { timeZone }).format(date);
function shiftDay(day, offset) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
function appointmentsPath(from, to, pageSize = 1) {
  return '/appointments?' + new URLSearchParams({ from: `${from}T00:00:00-03:00`, to: `${to}T23:59:59.999-03:00`, pageSize: String(pageSize) });
}
const statusLabels = { SCHEDULED: 'Agendado', COMPLETED: 'Concluído', CANCELLED: 'Cancelado' };
const statusClasses = { SCHEDULED: 'status-booked', COMPLETED: 'status-done', CANCELLED: 'status-pending' };

export default function Dashboard() {
  const { user } = useAuth();
  const [now] = useState(() => new Date());
  const today = dateKey(now);
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  const weekStart = shiftDay(today, -((weekday + 6) % 7));
  const weekEnd = shiftDay(weekStart, 6);
  const clients = useRemote('/clients?pageSize=1&status=ACTIVE');
  const week = useRemote(appointmentsPath(weekStart, weekEnd, 100));
  const daily = useRemote(appointmentsPath(today, today));
  const cards = [
    { label: 'Clientes ativos', result: clients, icon: <FiUsers />, to: '/clientes' },
    { label: 'Agendamentos da semana', result: week, icon: <FiCalendar />, to: '/agendamentos' },
    { label: 'Atendimentos de hoje', result: daily, icon: <FiZap />, to: '/agendamentos' },
  ];
  const groups = (week.data?.items || []).reduce((days, appointment) => {
    const key = dateKey(new Date(appointment.startsAt));
    (days[key] ||= []).push(appointment);
    return days;
  }, {});
  return <main className="workspace dashboard-page">
    <header className="page-heading home-heading">
      <div><h1>Olá, {user.name.split(' ')[0]}!</h1><p>Disciplina hoje, resultados sempre.</p></div>
      <div className="dashboard-date"><div className="date-display"><strong>{new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone }).format(now)}</strong><span>{new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone }).format(now)}</span></div><FiCalendar aria-hidden="true" /></div>
    </header>
    <section className="stats-grid" aria-label="Resumo dos atendimentos">
      {cards.map(({ label, result, icon, to }) => <Link className="stat-card dashboard-stat" to={to} key={label} aria-label={`${label}: ${result.loading ? 'carregando' : result.data?.total ?? 'indisponível'}`}>
        <div><strong>{result.loading ? '…' : result.data?.total ?? '—'}</strong><span>{label}</span></div><i aria-hidden="true">{icon}</i>
      </Link>)}
    </section>
    {cards.filter(({ result }) => result.error).map(({ label, result }) => <p key={label} role="alert" className="catalog-error">{label}: {result.error}</p>)}
    <section aria-labelledby="dashboard-agenda-title">
      <div className="section-heading"><h2 id="dashboard-agenda-title">Agenda da semana</h2><Link className="text-action" to="/agendamentos">Ver agenda completa <FiArrowRight aria-hidden="true" /></Link></div>
      {week.loading && <p role="status">Carregando agenda…</p>}
      {week.data && !week.data.items.length && <p className="catalog-empty">Nenhum agendamento nesta semana.</p>}
      {Object.entries(groups).map(([day, appointments]) => <div className="dashboard-day" key={day}>
        <h3 className="day-label">{day === today ? 'Hoje' : day === shiftDay(today, 1) ? 'Amanhã' : new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone }).format(new Date(`${day}T12:00:00-03:00`))} · {day.slice(8)}/{day.slice(5, 7)}</h3>
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
