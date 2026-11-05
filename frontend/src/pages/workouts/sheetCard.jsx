import { useState } from 'react';
import { useRemote } from '../../lib/useRemote';
import SheetDetails from './sheetDetails';

export default function SheetCard({ sheet, ...actions }) {
  const [expanded, setExpanded] = useState(false);
  const [revision, setRevision] = useState(0);
  const { data, loading, error } = useRemote(!sheet.blocks && expanded ? '/workout-sheets/' + sheet.id : null, revision);
  if (sheet.blocks || data) return <SheetDetails sheet={data || sheet} {...actions} />;
  return <article className="settings-section sheet-card">
    <div className="section-heading"><div><h2>{sheet.title}</h2><p>{sheet._count.blocks} treino(s)</p></div>
      <button type="button" className="button button-outline" disabled={loading} onClick={() => { setExpanded(true); setRevision((value) => value + 1); }}>{loading ? 'Carregando…' : error ? 'Tentar novamente' : 'Ver ficha e ações'}</button>
    </div>
    {error && <p role="alert" className="catalog-error">{error}</p>}
  </article>;
}
