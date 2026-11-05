import { useState } from 'react';
import { FiCopy } from 'react-icons/fi';
import { filterBlocks, workoutLevels } from '../../lib/workoutSheets';
const levelName = (value) => workoutLevels.find((level) => level.value === value)?.label || value;

export function BlockFilters({ filters, setFilters }) {
  return <div className="block-library-filters">
    <label className="field">Buscar modelo<input type="search" placeholder="Nome ou foco…" value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} /></label>
    <label className="field">Nível<select value={filters.level} onChange={(event) => setFilters({ ...filters, level: event.target.value })}><option value="">Todos os níveis</option>{workoutLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}</select></label>
    <label className="field">Foco<input placeholder="Todos os focos" value={filters.focus} onChange={(event) => setFilters({ ...filters, focus: event.target.value })} /></label>
  </div>;
}

export default function TemplatePicker({ templates, onChoose, label = 'Adicionar modelo à ficha' }) {
  const [filters, setFilters] = useState({ q: '', level: '', focus: '' });
  const [selected, setSelected] = useState('');
  const visible = filterBlocks(templates, filters);
  return <div className="template-picker">
    <BlockFilters filters={filters} setFilters={(next) => { setFilters(next); setSelected(''); }} />
    <div className="workout-add-exercise"><label className="field">Modelo de referência<select value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">{visible.length ? 'Selecione um modelo de bloco' : 'Nenhum modelo encontrado'}</option>{visible.map((template) => <option key={template.id} value={template.id}>{template.title} · {levelName(template.level)}{template.focus ? ` · ${template.focus}` : ''}</option>)}</select></label>
      <button type="button" className="button button-outline" disabled={!selected} onClick={() => { onChoose(templates.find((template) => template.id === selected)); setSelected(''); }}><FiCopy />{label}</button>
    </div>
  </div>;
}

