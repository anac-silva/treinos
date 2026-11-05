import { NavLink, useLocation, useParams } from 'react-router-dom';
import { FiUser, FiClipboard, FiActivity, FiClock } from 'react-icons/fi';
export default function ClientTabs() {
  const { clientId, assessmentId } = useParams();
  const { pathname } = useLocation();
  if (!clientId) return null;
  const tabs = [
    { path: 'visaogeral', label: 'Visão geral', Icon: FiUser, related: ['editar'] },
    { path: 'medidas', label: 'Medidas', Icon: FiClipboard, related: ['novaavaliacao'] },
    { path: 'treinos', label: 'Treinos', Icon: FiActivity, related: [] },
    { path: 'historico', label: 'Histórico', Icon: FiClock, related: assessmentId ? [`avaliacoes/${assessmentId}/corrigir`] : [] },
  ];
  return <nav className="profile-tabs" aria-label="Dados do aluno">
    {tabs.map(({ path, label, Icon, related }) => <NavLink key={path} to={`/clientes/${clientId}/${path}`} className={({ isActive }) => 'profile-tab' + (isActive || related.some((suffix) => pathname.endsWith('/' + suffix)) ? ' selected' : '')}><Icon aria-hidden="true" />{label}</NavLink>)}
  </nav>;
}

