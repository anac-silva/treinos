import Pagination from '../../components/pagination';

export default function SheetPagination({ library }) {
  return <>
    {library.sheetsError && <p role="alert" className="catalog-error">{library.sheetsError} <button type="button" onClick={library.reload}>Tentar novamente</button></p>}
    {library.sheetsLoading && <p role="status">Carregando fichas…</p>}
    <Pagination page={library.page} pageSize={10} total={library.total} loading={library.sheetsLoading} onPage={library.setPage} />
  </>;
}
