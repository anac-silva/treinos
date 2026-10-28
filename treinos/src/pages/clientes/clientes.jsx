import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRemote } from '../../lib/useRemote';
function Results({ path, page, setPage }) {
  const { data, error, loading } = useRemote(path);
  if (loading) return <p role="status">Carregando clientes…</p>;
  if (error) return <p role="alert" className="catalog-error">{error}</p>;
  return <><div className="table-wrap"><table className="data-table"><thead><tr><th>Nome</th><th>Objetivo</th><th>Status</th><th>Ações</th></tr></thead><tbody>
    {data.items.map((client) => <tr key={client.id}><td><Link to={'/clientes/' + client.id + '/visaogeral'}>{client.name}</Link></td><td>{client.goal || '—'}</td><td>{client.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</td><td><Link to={'/clientes/' + client.id + '/editar'}>Editar</Link></td></tr>)}
    {!data.items.length && <tr><td colSpan="4">Nenhum cliente encontrado.</td></tr>}
  </tbody></table></div><footer className="table-footer"><span>{data.total} clientes · Página {page}</span><div className="pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button><button disabled={page * data.pageSize >= data.total} onClick={() => setPage(page + 1)}>Próxima</button></div></footer></>;
}
export default function Clientes() {
  const [filters, setFilters] = useState({ q: '', status: '', goal: '' });
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ page: String(page), pageSize: '20', ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) });
  const path = '/clients?' + params;
  function search(event) { event.preventDefault(); setFilters(Object.fromEntries(new FormData(event.currentTarget))); setPage(1); }
  return <main className="workspace"><header className="page-heading"><div><h1>Clientes</h1><p>Gerencie seus alunos e acompanhe a evolução.</p></div><Link className="button button-primary" to="/clientes/novocliente">Novo cliente</Link></header>
    <form onSubmit={search} className="toolbar"><label className="field">Nome, e-mail ou telefone<input name="q" type="search" /></label><label className="field">Objetivo<input name="goal" /></label><label className="field">Status<select name="status"><option value="">Todos</option><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option></select></label><button className="button button-outline">Buscar</button></form>
    <Results key={path} path={path} page={page} setPage={setPage} />
  </main>;
}
