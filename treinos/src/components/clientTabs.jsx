import { NavLink } from "react-router-dom";

const tabs = [
  ["/clientes/visaogeral", "Visão geral"],
  ["/clientes/medidas", "Medidas"],
  ["/clientes/novaavaliacao", "Avaliação"],
  ["/clientes/treinos", "Treinos"],
];

export default function ClientTabs() {
  return <nav className="profile-tabs" aria-label="Dados do cliente">
    {tabs.map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => `profile-tab${isActive ? " selected" : ""}`}>{label}</NavLink>)}
  </nav>;
}
