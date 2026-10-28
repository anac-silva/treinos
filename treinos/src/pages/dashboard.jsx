import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import { useRemote } from '../lib/useRemote';
export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useRemote('/clients?pageSize=1&status=ACTIVE');
  return <main className="workspace"><h1>Olá, {user.name}</h1><p>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'America/Sao_Paulo' }).format(new Date())}</p>
    {loading && <p role="status">Carregando resumo…</p>}{error && <p role="alert" className="catalog-error">{error}</p>}{data && <section className="settings-section"><h2>{data.total} clientes ativos</h2><Link className="button button-primary" to="/clientes">Gerenciar clientes</Link></section>}
    <p className="notice-banner">Agendamentos e prescrição de treinos aguardam implementação no servidor.</p>
  </main>;
}
