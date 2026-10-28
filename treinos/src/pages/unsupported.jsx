import { Link, useParams } from 'react-router-dom';
import ClientTabs from '../components/clientTabs';
export default function Unsupported({ kind }) {
  const { clientId } = useParams();
  return <main className="workspace"><h1>{kind === 'agenda' ? 'Agendamentos' : 'Treinos'}</h1>{clientId && <ClientTabs />}<p className="notice-banner">{kind === 'agenda' ? 'A agenda' : 'A prescrição de treinos'} ainda não possui endpoints no servidor. Este recurso estará disponível após a implementação desse módulo.</p><Link to="/clientes" className="button button-outline">Voltar para clientes</Link></main>;
}
