import { Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { Sidebar } from './layout/sidebar';
import AuthProvider from '../contexts/AuthProvider';
import { useAuth } from '../contexts/authContext';
import CatalogProvider from '../contexts/CatalogProvider';
import AuthPage from '../pages/auth';
import Clientes from '../pages/clientes/clientes';
import ClientForm from '../pages/clientForm';
import ClientDetail from '../pages/clientDetail';
import AssessmentForm from '../pages/assessmentForm';
import Configuracoes from '../pages/configuracoes/configuracoes';
import Dashboard from '../pages/dashboard';
import Unsupported from '../pages/unsupported';
function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <main className="workspace" role="status">Verificando sessão…</main>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <div className="app-layout"><Sidebar /><AuthPage change /></div>;
  return <CatalogProvider><div className="app-layout"><Sidebar /><Outlet /></div></CatalogProvider>;
}
function ClientRoute({ mode }) {
  const { clientId, assessmentId } = useParams();
  if (mode === 'edit') return <ClientForm key={clientId} />;
  if (mode === 'assessment') return <AssessmentForm key={clientId + (assessmentId || 'new')} />;
  return <ClientDetail key={clientId + mode} mode={mode} />;
}
export default function Body() {
  return <AuthProvider><Routes>
    <Route path="/login" element={<AuthPage />} />
    <Route element={<Protected />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/alterar-senha" element={<AuthPage change />} />
      <Route path="/clientes" element={<Clientes />} />
      <Route path="/clientes/novocliente" element={<ClientForm />} />
      <Route path="/clientes/:clientId/editar" element={<ClientRoute mode="edit" />} />
      <Route path="/clientes/:clientId/visaogeral" element={<ClientRoute mode="overview" />} />
      <Route path="/clientes/:clientId/medidas" element={<ClientRoute mode="measurements" />} />
      <Route path="/clientes/:clientId/novaavaliacao" element={<ClientRoute mode="assessment" />} />
      <Route path="/clientes/:clientId/avaliacoes/:assessmentId/corrigir" element={<ClientRoute mode="assessment" />} />
      <Route path="/clientes/:clientId/treinos" element={<Unsupported kind="treinos" />} />
      <Route path="/configuracoes" element={<Configuracoes />} />
      <Route path="/agendamentos" element={<Unsupported kind="agenda" />} />
      <Route path="/agendamentos/novoagendamento" element={<Navigate to="/agendamentos" replace />} />
      {['visaogeral', 'medidas', 'novaavaliacao', 'treinos'].map((path) => <Route key={path} path={'/clientes/' + path} element={<Navigate to="/clientes" replace />} />)}
      <Route path="*" element={<main className="workspace"><h1>Página não encontrada</h1></main>} />
    </Route>
  </Routes></AuthProvider>;
}
