import { useState } from 'react';
import { FiCopy } from 'react-icons/fi';
import { blockLetter, workoutLevels } from '../../lib/workoutSheets';
import ExerciseList from './exerciseList';
const levelName = (value) => workoutLevels.find((level) => level.value === value)?.label || value;
const dateLabel = (value) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'America/Sao_Paulo' }).format(new Date(value));

export default function SheetCard({ sheet, onCopy, onAdjust, onTemplate }) {
  const [active, setActive] = useState(0);
  const block = sheet.blocks[active];
  return <article className="settings-section sheet-card">
    <div className="section-heading"><div><h2>{sheet.title}</h2><p>{sheet.blocks.length} treino(s) · {dateLabel(sheet.createdAt)}{sheet.client && ` · ${sheet.client.name}`}</p></div><div className="sheet-toolbar">
      {sheet.isActive && <span className="status status-done">Ficha atual</span>}
      {onAdjust && <button type="button" className="button button-outline" onClick={() => onAdjust(sheet)}>Ajustar ficha</button>}
      {onCopy && <button type="button" className="button button-outline" onClick={() => onCopy(sheet)}><FiCopy />Copiar ficha</button>}
      {onTemplate && <button type="button" className="button button-outline" onClick={() => onTemplate(sheet)}>Salvar como modelo</button>}
    </div></div>
    {sheet.notes && <p className="workout-readable-notes">{sheet.notes}</p>}
    <div className="sheet-block-tabs" role="group" aria-label={`Treinos de ${sheet.title}`}>{sheet.blocks.map((item, index) => <button type="button" aria-pressed={active === index} className={active === index ? 'selected' : ''} key={item.id} onClick={() => setActive(index)}>Treino {blockLetter(index)}<small>{item.title}</small></button>)}</div>
    {block && <div className="sheet-block-preview"><h3>{blockLetter(active)} — {block.title}</h3><p className="catalog-empty">{levelName(block.level)}{block.focus && ` · ${block.focus}`}</p><ExerciseList block={block} /></div>}
  </article>;
}
