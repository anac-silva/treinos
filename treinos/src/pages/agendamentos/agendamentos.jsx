import { FiCalendar, FiChevronLeft, FiChevronRight, FiFilter, FiMoreHorizontal, FiPlus, FiX } from "react-icons/fi";
import { useEffect, useRef, useState } from "react";

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
  const [modalAberto, setModalAberto] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!modalAberto) return;

    const modal = modalRef.current;
    const previousOverflow = document.body.style.overflow;
    modal.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      modal.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [modalAberto]);

  return (
    <main className="workspace">
      <header className="page-heading">
        <div>
          <h1>Agendamentos</h1>
          <p>Visualize e gerencie todos os seus atendimentos.</p>
        </div>
        
        <button className="button button-primary" onClick={() =>setModalAberto(true)}><FiPlus /> Novo agendamento</button></header>
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

      {modalAberto && (
        <dialog
          ref={modalRef}
          className="appointment-modal"
          aria-labelledby="appointment-modal-title"
          onCancel={() => setModalAberto(false)}
        >
          <header className="appointment-modal-heading">
            <span className="appointment-modal-icon"><FiCalendar aria-hidden="true" /></span>
            <h2 id="appointment-modal-title">Novo agendamento</h2>
            <button
              type="button"
              className="icon-button appointment-modal-close"
              aria-label="Fechar modal"
              onClick={() => setModalAberto(false)}
            >
              <FiX aria-hidden="true" />
            </button>
          </header>
          <div className="appointment-modal-fields">
            <label className="field appointment-modal-full-field">
              Nome do cliente
              <input type="text" name="cliente" placeholder="Digite o nome do cliente" />
            </label>
            <label className="field">
              Data
              <input type="date" name="data" />
            </label>
            <label className="field">
              Horário
              <input type="time" name="horario" />
            </label>
            <label className="field appointment-modal-full-field">
              Assunto
              <textarea name="assunto" placeholder="Ex: Avaliação física ou treino de membros inferiores" rows="3" />
            </label>
          </div>
          <footer className="appointment-modal-footer">
            <button type="button" className="button button-primary" onClick={() => setModalAberto(false)}>
              Fechar
            </button>
          </footer>
        </dialog>
      )}
    </main>
  );
}

export default Agendamentos;
