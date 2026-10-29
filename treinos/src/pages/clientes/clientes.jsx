import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { useRemote } from '../../lib/useRemote';
import './clientes.css';

function Results({ path, page, pageSize, setPage }) {
  const { data, error, loading } = useRemote(path);
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / pageSize));
  return <>
    <table className="data-table clients-table">
      <thead><tr><th scope="col">Nome</th><th scope="col">Objetivo</th><th scope="col">Status</th><th scope="col">Ações</th></tr></thead>
      <tbody>
        {loading ? <tr><td colSpan="4" role="status">Carregando clientes…</td></tr> : error ? <tr><td colSpan="4" role="alert" className="catalog-error">{error}</td></tr> : <>
          {data.items.map((client) => <tr key={client.id}>
            <td><Link className="client-name" to={'/clientes/' + client.id + '/visaogeral'}><span className="avatar avatar-small" aria-hidden="true">{client.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span><strong title={client.name}>{client.name}</strong></Link></td>
            <td title={client.goal || undefined}>{client.goal || '—'}</td>
            <td><span className={'status ' + (client.status === 'ACTIVE' ? 'status-done' : 'status-pending')}>{client.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</span></td>
            <td><Link className="client-edit" to={'/clientes/' + client.id + '/editar'} aria-label={'Editar ' + client.name}>Editar</Link></td>
          </tr>)}
          {!data.items.length && <tr><td colSpan="4">Nenhum cliente encontrado.</td></tr>}
        </>}
      </tbody>
    </table>
    <footer className="table-footer clients-footer">
      <span aria-live="polite">{data ? `${data.total} clientes · Página ${page} de ${totalPages}` : loading ? 'Carregando…' : 'Clientes indisponíveis'}</span>
      <nav className="pagination" aria-label="Paginação de clientes">
        <button type="button" className="button button-outline" disabled={loading || page === 1} onClick={() => setPage(page - 1)}>Anterior</button>
        <button type="button" className="button button-outline" disabled={loading || !data || page >= totalPages} onClick={() => setPage(page + 1)}>Próxima</button>
      </nav>
    </footer>
  </>;
}

export default function Clientes() {
  const [filters, setFilters] = useState({ q: '', status: '', goal: '' });
  const [{ page, pageSize }, setPagination] = useState({ page: 1, pageSize: null });
  const resultsRef = useRef(null);
  useLayoutEffect(() => {
    const element = resultsRef.current;
    const observer = new ResizeObserver(() => {
      // Keep these measurements in sync with the table header and row heights in clientes.css.
      const size = Math.max(1, Math.min(100, Math.floor((element.clientHeight - 64 - 40) / 52)));
      setPagination((current) => current.pageSize === size ? current : { page: 1, pageSize: size });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) });
  const path = '/clients?' + params;
  function search(event) {
    event.preventDefault();
    setFilters(Object.fromEntries(new FormData(event.currentTarget)));
    setPagination((current) => ({ ...current, page: 1 }));
  }
  return <main className="workspace clients-page">
    <header className="page-heading"><div><h1>Clientes</h1><p>Gerencie seus alunos e acompanhe a evolução.</p></div><Link className="button button-primary" to="/clientes/novocliente"><FiPlus aria-hidden="true" />Novo cliente</Link></header>
    <form onSubmit={search} className="toolbar clients-toolbar" role="search" aria-label="Buscar clientes">
      <label className="field clients-search">Nome, e-mail ou telefone<span className="clients-search-input"><FiSearch aria-hidden="true" /><input name="q" type="search" placeholder="Buscar cliente…" /></span></label>
      <label className="field">Objetivo<input name="goal" placeholder="Todos os objetivos" /></label>
      <label className="field">Status<select name="status"><option value="">Todos</option><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option></select></label>
      <button type="submit" className="button button-outline">Buscar</button>
    </form>
    <div ref={resultsRef} className="clients-results">
      {pageSize && <Results key={path} path={path} page={page} pageSize={pageSize} setPage={(next) => setPagination((current) => ({ ...current, page: next }))} />}
    </div>
  </main>;
}

