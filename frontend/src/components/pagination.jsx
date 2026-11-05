export default function Pagination({ page, pageSize, total, onPage, loading = false }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <nav className="pagination" aria-label="Paginação">
    <button type="button" className="button button-outline" disabled={loading || page <= 1} onClick={() => onPage(page - 1)}>Anterior</button>
    <span aria-live="polite">Página {page} de {pages}</span>
    <button type="button" className="button button-outline" disabled={loading || page >= pages} onClick={() => onPage(page + 1)}>Próxima</button>
  </nav>;
}
