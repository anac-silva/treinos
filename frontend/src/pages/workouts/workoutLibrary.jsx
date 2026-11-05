import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiCopy } from 'react-icons/fi';
import { filterBlocks, workoutLevels } from '../../lib/workoutSheets';
import BlockEditor from './blockEditor';
import SheetEditor from './sheetEditor';
import SheetChooser from './sheetChooser';
import SheetCard from './sheetCard';
import ExerciseList from './exerciseList';
import { BlockFilters } from './templatePicker';
import SheetPagination from './sheetPagination';
const levelName = (value) => workoutLevels.find((level) => level.value === value)?.label || value;

export default function WorkoutLibrary({ library, exercises }) {
  const [tab, setTab] = useState('blocks');
  const [editor, setEditor] = useState(null);
  const [filters, setFilters] = useState({ q: '', level: '', focus: '' });
  const close = () => setEditor(null);
  const saved = () => { close(); library.reload(); };
  const templates = filterBlocks(library.templates, filters);
  const sheetTemplates = library.sheets.filter((sheet) => !sheet.clientId);
  return <main className="workspace workout-page">
    <header className="page-heading"><div><h1>Modelos de treino</h1><p>Blocos independentes para combinar e fichas completas para reaproveitar.</p></div></header>
    <div className="workout-library-tabs" role="group" aria-label="Biblioteca de treinos"><button type="button" aria-pressed={tab === 'blocks'} className={tab === 'blocks' ? 'selected' : ''} onClick={() => { setTab('blocks'); close(); }}>Modelos de blocos</button><button type="button" aria-pressed={tab === 'sheets'} className={tab === 'sheets' ? 'selected' : ''} onClick={() => { setTab('sheets'); close(); }}>Fichas completas</button></div>
    {editor?.kind === 'block' ? <BlockEditor source={editor.source} editing={editor.editing} exercises={exercises} onClose={close} onSaved={saved} />
      : editor?.kind === 'sheet' ? <SheetEditor key={editor.source?.id || 'new'} source={editor.source} library={library} exercises={exercises} onClose={close} onSaved={saved} />
        : editor?.kind === 'choose' ? <SheetChooser onClose={close} onChoose={(source) => setEditor({ kind: 'sheet', source })} />
          : tab === 'blocks' ? <>
            <div className="section-heading"><h2>Biblioteca de blocos</h2><button type="button" className="button button-primary" onClick={() => setEditor({ kind: 'block' })}><FiPlus />Novo modelo de bloco</button></div>
            <BlockFilters filters={filters} setFilters={setFilters} />
            {templates.map((template) => <article className="settings-section workout-card" key={template.id}><div className="section-heading"><div><h2>{template.title}</h2><p>{levelName(template.level)} · {template.focus || 'Foco livre'} · {template.exercises.length} exercício(s)</p></div><div className="sheet-toolbar"><button type="button" className="button button-outline" onClick={() => setEditor({ kind: 'block', source: template, editing: true })}>Editar</button><button type="button" className="button button-outline" onClick={() => setEditor({ kind: 'block', source: template })}><FiCopy />Duplicar</button></div></div><details><summary>Ver exercícios</summary><ExerciseList block={template} /></details></article>)}
            {!templates.length && <p className="catalog-empty">Nenhum modelo encontrado. Crie variações de superiores, inferiores ou outros focos.</p>}
          </> : <>
            <div className="section-heading"><h2>Modelos de fichas completas</h2><div className="sheet-toolbar"><button type="button" className="button button-outline" onClick={() => setEditor({ kind: 'choose' })}><FiCopy />Copiar ficha existente</button><button type="button" className="button button-primary" onClick={() => setEditor({ kind: 'sheet' })}><FiPlus />Nova ficha modelo</button></div></div>
            <SheetPagination library={library} />
            {sheetTemplates.map((sheet) => <SheetCard key={sheet.id} sheet={sheet} onCopy={(source) => setEditor({ kind: 'sheet', source })} />)}
            {!library.sheetsLoading && !library.sheetsError && !sheetTemplates.length && <p className="catalog-empty">Crie uma ficha modelo combinando blocos ou copie uma ficha de aluno.</p>}
          </>}
    <Link className="text-action" to="/clientes">Selecionar aluno para montar uma ficha</Link>
  </main>;
}

