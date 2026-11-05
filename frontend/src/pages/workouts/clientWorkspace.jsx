import { useState } from 'react';
import { FiPlus, FiCopy } from 'react-icons/fi';
import ClientPanel from '../../components/clientPanel';
import ClientHeader from '../../components/clientHeader';
import ClientTabs from '../../components/clientTabs';
import { useRemote } from '../../lib/useRemote';
import SheetEditor from './sheetEditor';
import SheetChooser from './sheetChooser';
import SheetCard from './sheetCard';
import SheetPagination from './sheetPagination';

export default function ClientWorkspace({ clientId, library, exercises }) {
  const { data: client, loading, error } = useRemote(`/clients/${clientId}`);
  const [editor, setEditor] = useState(null);
  const query = library.query;
  const setQuery = library.setQuery;
  if (loading) return <main className="workspace" role="status">Carregando aluno…</main>;
  if (error) return <main className="workspace"><p role="alert">{error}</p></main>;
  const sheets = library.sheets.filter((sheet) => sheet.clientId === clientId);
  const current = library.current;
  const history = sheets;
  const close = () => setEditor(null);
  const saved = () => { close(); library.reload(); };
  return <ClientPanel className="workout-page"><ClientHeader client={client} /><ClientTabs />
    <header className="page-heading workout-client-heading"><div><h1>Ficha de treinos</h1><p>Organize os treinos A, B, C… e personalize cada bloco para {client.name.split(' ')[0]}.</p></div></header>
    {editor?.kind === 'template' ? <SheetEditor source={editor.source} library={library} exercises={exercises} onClose={close} onSaved={saved} /> : client.status !== 'ACTIVE' ? <p className="notice-banner">Complete ou ative o cadastro antes de prescrever uma ficha.</p>
      : editor?.kind === 'choose' ? <SheetChooser onClose={close} onChoose={(source) => setEditor({ kind: 'sheet', source })} />
        : editor ? <SheetEditor key={`${editor.source?.id || 'new'}:${editor.kind}`} client={editor.kind === 'template' ? null : client} source={editor.source} library={library} exercises={exercises} onClose={close} onSaved={saved} />
          : <div className="sheet-toolbar sheet-main-actions"><button type="button" className="button button-primary" onClick={() => setEditor({ kind: 'sheet' })}><FiPlus />Nova ficha</button><button type="button" className="button button-outline" onClick={() => setEditor({ kind: 'choose' })}><FiCopy />Copiar ficha completa</button></div>}
    {!editor && <>
      {current ? <SheetCard sheet={current} onCopy={client.status === 'ACTIVE' ? (source) => setEditor({ kind: 'sheet', source }) : null} onAdjust={client.status === 'ACTIVE' ? (source) => setEditor({ kind: 'sheet', source }) : null} onTemplate={(source) => setEditor({ kind: 'template', source })} /> : <p className="catalog-empty">Este aluno ainda não tem uma ficha atual.</p>}
      {<details className="sheet-history"><summary>Histórico de fichas ({library.total})</summary><p className="catalog-empty">As versões anteriores preservam todos os treinos e exercícios.</p><label className="field">Buscar ficha anterior<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label><SheetPagination library={library} />{history.map((sheet) => <SheetCard key={sheet.id} sheet={sheet} onCopy={client.status === 'ACTIVE' ? (source) => setEditor({ kind: 'sheet', source }) : null} onTemplate={(source) => setEditor({ kind: 'template', source })} />)}</details>}
    </>}
  </ClientPanel>;
}

