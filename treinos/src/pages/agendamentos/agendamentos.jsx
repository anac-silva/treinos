import { FiCalendar, FiChevronLeft, FiChevronRight, FiFilter, FiMoreHorizontal, FiPlus } from "react-icons/fi";

const appointments = [
  ["08:00", "CS", "Carlos Silva", "Treino de membros inferiores", "Concluído", "status-done", "avatar-blue"],
  ["09:00", "MC", "Marina Costa", "Avaliação física", "Em andamento", "status-progress", "avatar-rose"],
  ["10:00", "JP", "João Pereira", "Treino de membros superiores", "Pendente", "status-pending", "avatar-dark"],
  ["11:00", "AC", "Ana Clara", "Treino funcional", "Pendente", "status-pending", "avatar-green"],
  ["08:00", "RA", "Ricardo Almeida", "Treino de hipertrofia", "Agendado", "status-booked", "avatar-violet"],
  ["09:00", "FL", "Fernanda Lima", "Treino funcional", "Agendado", "status-booked", "avatar-coral"],
  ["10:00", "LS", "Lucas Santos", "Avaliação física", "Agendado", "status-booked", "avatar-amber"],
];

const appointmentDays = [
  { label: "Hoje", date: "15/09", appointments: appointments.slice(0, 4) },
  { label: "Amanhã", date: "16/09", appointments: appointments.slice(4) },
];

function Agendamentos() {
  return (
    <main className="workspace">
      <header className="page-heading"><div><h1>Agendamentos</h1><p>Visualize e gerencie todos os seus atendimentos.</p></div><button className="button button-primary"><FiPlus /> Novo agendamento</button></header>
      <div className="calendar-toolbar">
        <button className="button button-outline current-week">Semana atual <FiCalendar /></button>
        <button className="icon-button square-button"><FiChevronLeft /></button><button className="icon-button square-button"><FiChevronRight /></button>
        <div className="date-range">15 – 21 de setembro de 2026</div>
        <button className="button button-outline"><FiFilter /> Filtros</button>
      </div>
      <div className="view-tabs"><div className="view-tab selected">Lista</div><div className="view-tab">Semana</div><div className="view-tab">Dia</div></div>
      {appointmentDays.map(({ label, date, appointments: dayAppointments }) => <section className="schedule-day" key={label}>
        <div className="day-label schedule-day-label">{label} <span>•</span> {date}</div>
        <div className="table-wrap">
          <table className="data-table schedule-table">
            <thead><tr><th>Horário</th><th>Cliente</th><th>Tipo de atendimento</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {dayAppointments.map(([time, initials, name, type, status, statusClass, avatar]) => <tr key={`${time}-${name}`}>
                <td>{time}</td><td><span className={`avatar avatar-small ${avatar}`}>{initials}</span><strong>{name}</strong></td><td className="muted-cell">{type}</td><td><span className={`status ${statusClass}`}>{status}</span></td><td><button className="icon-button"><FiMoreHorizontal /></button></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>)}
    </main>
  );
}

export default Agendamentos;