import { FiArrowLeft, FiEdit2 } from "react-icons/fi";

function VisaoGeralCliente() {
  return (
    <main className="workspace profile-workspace">
      <div className="profile-topline"><span className="back-link"><FiArrowLeft /> Voltar</span><button className="button button-outline"><FiEdit2 /> Editar</button></div>
      <header className="client-profile"><div className="avatar avatar-profile avatar-rose">MS</div><div><h1>Marina Silva</h1><p>28 anos <span>•</span> 1,65 m <span>•</span> 62 kg</p><div className="profile-tags"><span className="goal-tag">Emagrecimento</span><span className="status status-done">Ativo</span></div></div></header>
      <nav className="profile-tabs"><div className="profile-tab selected">Visão geral</div><div className="profile-tab">Medidas</div><div className="profile-tab">Treinos</div><div className="profile-tab">Histórico</div></nav>
      <section className="chart-section"><div className="section-heading"><h2>Evolução corporal</h2><button className="button button-outline">Últimos 6 meses⌄</button></div>
        <div className="chart-area"><div className="chart-y-labels"><span>90</span><span>70</span><span>50</span><span>30</span><span>10</span></div><div className="chart-content"><div className="chart-grid"><div></div><div></div><div></div><div></div><div></div></div><div className="chart-line weight-line"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div className="chart-line waist-line"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div className="chart-line hip-line"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div className="chart-months"><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span><span>Jul</span><span>Ago</span><span>Set</span></div></div></div>
        <div className="chart-legend"><span><i className="legend-weight"></i>Peso (kg)</span><span><i className="legend-waist"></i>Cintura (cm)</span><span><i className="legend-hip"></i>Quadril (cm)</span></div>
      </section>
      <section className="metric-cards"><article><strong>- 8 kg</strong><span>Peso</span></article><article><strong>- 6 cm</strong><span>Cintura</span></article><article><strong>- 5 cm</strong><span>Quadril</span></article><article className="metric-highlight"><strong>+ 12%</strong><span>Massa muscular</span></article></section>
      <div className="motivation-banner"><span>Disciplina hoje,<br />resultados sempre.</span></div>
    </main>
  );
}

export default VisaoGeralCliente;