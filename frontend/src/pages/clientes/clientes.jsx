import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { useRemote } from '../../lib/useRemote';
import { api } from '../../lib/api';
import './clientes.css';

function Results({ path, page, pageSize, setPage }) {
  const [revision, setRevision] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');
  const { data, error, loading } = useRemote(path, revision);
  async function remove(client) {
    if (!window.confirm(`Excluir o pré-cadastro de ${client.name}? Os agendamentos serão preservados.`)) return;
    setBusyId(client.id); setActionError('');
    try {
      await api(`/clients/${client.id}`, { method: 'DELETE' });
      if (data.items.length === 1 && page > 1) setPage(page - 1);
      else setRevision((value) => value + 1);
    } catch (error) { setActionError(error.message); } finally { setBusyId(null); }
  }
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / pageSize));
  return <>
    <table className="data-table clients-table">
      <thead><tr><th scope="col">Nome</th><th scope="col">Objetivo</th><th scope="col">Status</th><th scope="col">Ações</th></tr></thead>
      <tbody>
        {loading ? <tr><td colSpan="4" role="status">Carregando alunos…</td></tr> : error ? <tr><td colSpan="4" role="alert" className="catalog-error">{error}</td></tr> : <>
          {data.items.map((client) => <tr key={client.id}>
            <td><Link className="client-name" to={'/clientes/' + client.id + (client.status === 'PRE_REGISTERED' ? '/editar' : '/visaogeral')}><span className="avatar avatar-small" aria-hidden="true">{client.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span><strong title={client.name}>{client.name}</strong></Link></td>
            <td title={client.goal || undefined}>{client.goal || '—'}</td>
            <td><span className={'status ' + (client.status === 'ACTIVE' ? 'status-done' : client.status === 'PRE_REGISTERED' ? 'status-booked' : 'status-pending')}>{client.status === 'ACTIVE' ? 'Ativo' : client.status === 'PRE_REGISTERED' ? 'Pré-cadastro' : 'Inativo'}</span></td>
            <td><div className="client-row-actions"><Link className="client-edit" to={'/clientes/' + client.id + '/editar'} aria-label={(client.status === 'PRE_REGISTERED' ? 'Completar cadastro de ' : 'Editar ') + client.name}>{client.status === 'PRE_REGISTERED' ? 'Completar cadastro' : 'Editar'}</Link>
              {client.status === 'PRE_REGISTERED' && <button type="button" className="client-delete" disabled={busyId !== null} onClick={() => remove(client)} aria-label={'Excluir pré-cadastro de ' + client.name}>{busyId === client.id ? 'Excluindo…' : 'Excluir'}</button>}</div></td>
          </tr>)}
          {!data.items.length && <tr><td colSpan="4">Nenhum aluno encontrado.</td></tr>}
        </>}
      </tbody>
    </table>
    <footer className="table-footer clients-footer">
      <span aria-live="polite">{actionError ? <span role="alert" className="catalog-error">{actionError}</span> : data ? `${data.total} alunos · Página ${page} de ${totalPages}` : loading ? 'Carregando…' : 'Alunos indisponíveis'}</span>
      <nav className="pagination" aria-label="Paginação de alunos">
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
    <header className="page-heading"><div><h1>Alunos</h1><p>Gerencie seus alunos e acompanhe a evolução.</p></div><Link className="button button-primary" to="/clientes/novocliente"><FiPlus aria-hidden="true" />Novo aluno</Link></header>
    <form onSubmit={search} className="toolbar clients-toolbar" role="search" aria-label="Buscar alunos">
      <label className="field clients-search">Nome, e-mail ou telefone<span className="clients-search-input"><FiSearch aria-hidden="true" /><input name="q" type="search" placeholder="Buscar aluno…" /></span></label>
      <label className="field">Objetivo<input name="goal" placeholder="Todos os objetivos" /></label>
      <label className="field">Status<select name="status"><option value="">Todos</option><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option><option value="PRE_REGISTERED">Apenas pré-cadastro</option></select></label>
      <button type="submit" className="button button-outline">Buscar</button>
    </form>
    <div ref={resultsRef} className="clients-results">
      {pageSize && <Results key={path} path={path} page={page} pageSize={pageSize} setPage={(next) => setPagination((current) => ({ ...current, page: next }))} />}
    </div>
  </main>;
}

