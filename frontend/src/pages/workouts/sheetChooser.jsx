import { useState } from 'react';
import { api } from '../../lib/api';
import { useRemote } from '../../lib/useRemote';
import Pagination from '../../components/pagination';
import { businessDateKey } from '../../lib/businessDate';

export default function SheetChooser({ onChoose, onClose }) {
  const [filters, setFilters] = useState({ q: '', page: 1 });
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');
  const params = new URLSearchParams({ view: 'summary', pageSize: '10', page: String(filters.page), q: filters.q });
  const { data, loading, error } = useRemote('/workout-sheets?' + params);
  async function choose(id) {
    setBusyId(id); setActionError('');
    try { onChoose(await api('/workout-sheets/' + id)); }
    catch (error) { setActionError(error.message); }
    finally { setBusyId(''); }
  }
  return <section className="settings-section">
    <div className="section-heading"><div><h2>Copiar ficha completa</h2><p>Escolha um modelo, uma ficha atual ou uma versão anterior.</p></div><button type="button" className="button button-outline" onClick={onClose}>Voltar</button></div>
    <label className="field">Buscar ficha ou aluno<input type="search" value={filters.q} onChange={(event) => setFilters({ q: event.target.value, page: 1 })} /></label>
    {(error || actionError) && <p role="alert" className="catalog-error">{error || actionError}</p>}
    {loading && <p role="status">Carregando fichas…</p>}
    <div className="sheet-source-list">{data?.items.map((sheet) => <button type="button" className="workout-source-option" disabled={Boolean(busyId)} key={sheet.id} onClick={() => choose(sheet.id)}>
      <strong>{sheet.title}</strong><span>{sheet.client?.name || 'Modelo de ficha'} · {sheet._count.blocks} treino(s) · {businessDateKey(sheet.createdAt).split('-').reverse().join('/')}{sheet.isActive ? ' · Atual' : ''}{busyId === sheet.id ? ' · Carregando…' : ''}</span>
    </button>)}</div>
    {data && !data.items.length && <p className="catalog-empty">Nenhuma ficha encontrada.</p>}
    <Pagination page={filters.page} pageSize={10} total={data?.total || 0} loading={loading} onPage={(page) => setFilters((value) => ({ ...value, page }))} />
  </section>;
}
