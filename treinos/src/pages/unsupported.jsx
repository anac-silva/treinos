import ClientPanel from '../components/clientPanel';
import ClientHeader from '../components/clientHeader';
import { Link, useParams } from 'react-router-dom';
import ClientTabs from '../components/clientTabs';
import { useRemote } from '../lib/useRemote';

function ClientTraining({ clientId }) {
  const { data: client, loading, error } = useRemote(`/clients/${clientId}`);
  return <ClientPanel>
    {loading && <p role="status">Carregando cliente…</p>}
    {error && <p role="alert" className="catalog-error">{error}</p>}
    {client && <><ClientHeader client={client} /><ClientTabs /><h2>Treinos</h2><p className="notice-banner">A prescrição de treinos estará disponível após a implementação desse módulo.</p></>}
  </ClientPanel>;
}
export default function Unsupported({ kind }) {
  const { clientId } = useParams();
  if (clientId) return <ClientTraining clientId={clientId} />;
  return <ClientPanel><header className="new-client-heading"><div><h1>{kind === 'agenda' ? 'Agendamentos' : 'Treinos'}</h1></div></header><p className="notice-banner">Este recurso ainda não está disponível.</p><Link to="/clientes" className="button button-outline">Voltar para clientes</Link></ClientPanel>;
}
