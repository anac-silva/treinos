import { NavLink, useParams } from 'react-router-dom';
export default function ClientTabs() {
  const { clientId } = useParams();
  if (!clientId) return null;
  return <nav className="profile-tabs" aria-label="Dados do cliente">
    {[['visaogeral', 'Visão geral'], ['medidas', 'Medidas'], ['novaavaliacao', 'Avaliação'], ['treinos', 'Treinos']].map(([path, label]) =>
      <NavLink key={path} to={'/clientes/' + clientId + '/' + path} className={({ isActive }) => 'profile-tab' + (isActive ? ' selected' : '')}>{label}</NavLink>)}
  </nav>;
}
