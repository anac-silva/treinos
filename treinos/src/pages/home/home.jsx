import { IoPeopleCircleOutline } from "react-icons/io5";
import { FaCalendarAlt } from "react-icons/fa";
import { FaArrowRightLong } from "react-icons/fa6";
import { BsLightningCharge } from "react-icons/bs";

function Home() {
  return (
    <main className="workspace">
      <header className="page-heading home-heading">
        <div>
          <h1>Olá, Leonardo!</h1>
          <p>Disciplina hoje, resultados sempre.</p>
        </div>
        <div className="date-display"><strong>Segunda-feira</strong><span>15 de setembro</span></div>
      </header>

      <section className="stats-grid" aria-label="Resumo">
        <article className="stat-card"><div><strong>32</strong><span>Clientes ativos</span></div><i><IoPeopleCircleOutline /></i></article>
        <article className="stat-card"><div><strong>18</strong><span>Agendamentos da semana</span></div><i><FaCalendarAlt /></i></article>
        <article className="stat-card"><div><strong>5</strong><span>Atendimentos de hoje</span></div><i><BsLightningCharge /></i></article>
      </section>

      <section className="schedule-section">
        <div className="section-heading"><h2>Agenda da semana</h2><span className="text-action">Ver agenda completa <FaArrowRightLong /></span></div>
        <div className="day-label">Hoje <span>•</span> 15/09</div>
        <div className="appointment-row"><time>08:00</time><strong>Carlos Silva</strong><span className="appointment-type">Treino de membros inferiores</span><span className="status status-done">Concluído</span></div>
        <div className="appointment-row"><time>09:00</time><strong>Marina Costa</strong><span className="appointment-type">Avaliação física</span><span className="status status-progress">Em andamento</span></div>
        <div className="appointment-row"><time>10:00</time><strong>João Pereira</strong><span className="appointment-type">Treino de membros superiores</span><span className="status status-pending">Pendente</span></div>
        <div className="appointment-row"><time>11:00</time><strong>Ana Clara</strong><span className="appointment-type">Treino funcional</span><span className="status status-pending">Pendente</span></div>
        <div className="day-label tomorrow">Amanhã <span>•</span> 16/09</div>
        <div className="appointment-row"><time>08:00</time><strong>Ricardo Almeida</strong><span className="appointment-type">Treino de hipertrofia</span><span className="status status-booked">Agendado</span></div>
        <div className="appointment-row"><time>09:00</time><strong>Fernanda Lima</strong><span className="appointment-type">Treino funcional</span><span className="status status-booked">Agendado</span></div>
      </section>
    </main>
  );
}

export default Home;