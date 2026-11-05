import { useState } from 'react';
import { FiCopy } from 'react-icons/fi';
import { filterBlocks, workoutLevels } from '../../lib/workoutSheets';
const levelName = (value) => workoutLevels.find((level) => level.value === value)?.label || value;

export function BlockFilters({ filters, setFilters }) {
  return <div className="block-library-filters">
    <label className="field">Buscar modelo<input type="search" placeholder="Nome ou foco…" value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} /></label>
    <label className="field">Nível<select value={filters.level} onChange={(event) => setFilters({ ...filters, level: event.target.value })}><option value="">Todos os níveis</option>{workoutLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}</select></label>
  </div>;
}

export default function TemplatePicker({ templates, onChoose, label = 'Adicionar' }) {
  const [filters, setFilters] = useState({ q: '', level: '' });
  const visible = filterBlocks(templates, filters);
  return <div className="template-picker">
    <BlockFilters filters={filters} setFilters={setFilters} />
    <p className="catalog-empty" role="status">{visible.length} {visible.length === 1 ? 'modelo disponível' : 'modelos disponíveis'}</p>
    <ul className="template-results" aria-label="Modelos cadastrados">
      {visible.map((template) => <li className="template-result" key={template.id}>
        <div className="template-result-info"><strong>{template.title}</strong><span>{levelName(template.level)}{template.focus ? ` · ${template.focus}` : ''} · {template.exercises.length} exercício(s)</span></div>
        <button type="button" className="button button-outline" aria-label={`${label}: ${template.title}`} onClick={() => onChoose(template)}><FiCopy aria-hidden="true" />{label}</button>
      </li>)}
    </ul>
    {!visible.length && <p className="catalog-empty">{templates.length ? 'Nenhum modelo encontrado. Altere a busca ou o nível.' : 'Nenhum modelo cadastrado.'}</p>}
  </div>;
}
