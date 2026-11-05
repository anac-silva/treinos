import { Link } from 'react-router-dom';
import { FiArrowLeft, FiEdit2 } from 'react-icons/fi';
import { useRemote } from '../lib/useRemote';
import './clientHeader.css';

function ClientPhoto({ id, name, initials }) {
  const { data } = useRemote(`/clients/${id}/photo`);
  return data?.url ? <img src={data.url} alt={`Foto de ${name}`} /> : <span aria-hidden="true">{initials}</span>;
}
export default function ClientHeader({ client }) {
  const initials = client.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const details = [
    ['E-mail', client.email], ['Telefone', client.phone],
    ['Sexo', client.sex === 'FEMALE' ? 'Feminino' : client.sex === 'MALE' ? 'Masculino' : null],
    ['Altura', client.heightCm ? `${new Intl.NumberFormat('pt-BR').format(Number(client.heightCm) / 100)} m` : null],
    ['Experiência', client.experienceLevel],
  ];
  return <>
    <Link to="/clientes" className="back-link"><FiArrowLeft aria-hidden="true" />Voltar para Clientes</Link>
    <header className="client-data-header">
      <div className="client-data-top"><div className="client-data-avatar">{client.photos?.length ? <ClientPhoto id={client.id} name={client.name} initials={initials} /> : <span aria-hidden="true">{initials}</span>}</div>
        <div className="client-data-identity"><h1>{client.name}</h1><div className="client-data-tags">{client.age != null && <span>{client.age} anos</span>}{client.goal && <span>{client.goal}</span>}<span className={'status ' + (client.status === 'ACTIVE' ? 'status-done' : 'status-pending')}>{client.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</span></div></div>
        <Link to={`/clientes/${client.id}/editar`} className="button button-outline"><FiEdit2 aria-hidden="true" />Editar cliente</Link>
      </div>
      <dl className="client-data-details">{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Não informado'}</dd></div>)}</dl>
      {client.notes && <p className="client-data-notes"><strong>Observações:</strong> {client.notes}</p>}
    </header>
  </>;
}
