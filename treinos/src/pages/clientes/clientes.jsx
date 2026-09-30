import { FiFilter, FiMoreHorizontal, FiPlus, FiSearch } from "react-icons/fi";
import { NavLink } from "react-router-dom";

const clients = [
  ["MS", "Marina Silva", "Emagrecimento", "12/09/2026", "Ativo", "avatar-rose"],
  ["JP", "João Pereira", "Hipertrofia", "11/09/2026", "Ativo", "avatar-blue"],
  ["AC", "Ana Clara", "Condicionamento", "10/09/2026", "Ativo", "avatar-green"],
  ["RA", "Ricardo Almeida", "Qualidade de vida", "10/09/2026", "Ativo", "avatar-violet"],
  ["LS", "Lucas Santos", "Performance", "09/09/2026", "Ativo", "avatar-amber"],
  ["FL", "Fernanda Lima", "Emagrecimento", "08/09/2026", "Ativo", "avatar-coral"],
  ["GR", "Gabriel Rocha", "Hipertrofia", "07/09/2026", "Ativo", "avatar-blue"],
  ["TS", "Tatiane Souza", "Condicionamento", "06/09/2026", "Inativo", "avatar-dark"],
];

function Clientes() {
  return (
    <main className="workspace clients-page">
      <header className="page-heading">
        <div><h1>Clientes</h1><p>Gerencie seus alunos e acompanhe a evolução.</p></div>
        <NavLink to="/clientes/novocliente" className="button button-primary">
          <FiPlus aria-hidden="true" /> Novo cliente
        </NavLink>
      </header>
      <div className="toolbar">
        <label className="search-field"><FiSearch /><input placeholder="Buscar por nome, objetivo ou status..." /></label>
        <button className="button button-outline"><FiFilter /> Filtros</button>
      </div>
      <section className="table-wrap">
        <table className="data-table clients-table">
          <thead><tr><th>Nome</th><th>Objetivo</th><th>Último treino</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>{clients.map(([initials, name, goal, date, status, avatar]) => (
            <tr key={name}>
              <td><span className={`avatar ${avatar}`}>{initials}</span><strong>{name}</strong></td>
              <td className="muted-cell">{goal}</td><td>{date}</td>
              <td><span className={`status ${status === "Ativo" ? "status-done" : "status-pending"}`}>{status}</span></td>
              <td><button className="icon-button" aria-label={`Ações para ${name}`}><FiMoreHorizontal /></button></td>
            </tr>
          ))}</tbody>
        </table>
      </section>
      <footer className="table-footer"><span>Mostrando 1 a 8 de 32 clientes</span><div className="pagination"><button className="icon-button">‹</button><button className="page-number selected">1</button><button className="page-number">2</button><button className="page-number">3</button><button className="page-number">4</button><button className="icon-button">›</button></div></footer>
    </main>
  );
}

export default Clientes;
