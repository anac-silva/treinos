import { useState } from 'react';
import { FiPlus, FiCopy, FiTrash2 } from 'react-icons/fi';
import { api } from '../../lib/api';
import { blockDraft, blockPayload, blockLetter, moveItem } from '../../lib/workoutSheets';
import BlockFields, { MoveButtons } from './blockFields';
import TemplatePicker from './templatePicker';

export default function SheetEditor({ client, source, library, exercises, onClose, onSaved }) {
  const initialLevel = { Iniciante: 'BASIC', Intermediário: 'INTERMEDIATE', Avançado: 'ADVANCED' }[client?.experienceLevel] || 'BASIC';
  const [title, setTitle] = useState(source?.title || '');
  const [notes, setNotes] = useState(source?.notes || '');
  const [blocks, setBlocks] = useState(() => source?.blocks.map((block) => blockDraft(block)) || [blockDraft(null, initialLevel)]);
  const [active, setActive] = useState(0);
  const [picker, setPicker] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const block = blocks[active];
  const updateBlock = (next) => setBlocks((current) => current.map((item, index) => index === active ? next : item));
  function chooseTemplate(template) {
    if (picker === 'replace') {
      if ((block.title || block.exercises.length) && !window.confirm('Substituir este bloco pelo modelo selecionado? Os outros treinos serão mantidos.')) return;
      updateBlock(blockDraft(template));
    } else if (blocks.length === 1 && !blocks[0].title && !blocks[0].exercises.length) {
      setBlocks([blockDraft(template)]); setActive(0);
    } else {
      if (blocks.length >= 26) return;
      setBlocks([...blocks, blockDraft(template)]); setActive(blocks.length);
    }
    setPicker(null);
  }
  async function submit(event) {
    event.preventDefault(); setError('');
    const invalid = blocks.findIndex((item) => !item.title.trim() || !item.exercises.length || item.exercises.some((exercise) => !exercise.repetitions.trim() || !Number.isInteger(Number(exercise.sets)) || Number(exercise.sets) < 1 || Number(exercise.sets) > 30 || (exercise.restSeconds !== '' && (!Number.isInteger(Number(exercise.restSeconds)) || Number(exercise.restSeconds) < 0 || Number(exercise.restSeconds) > 3600))));
    if (invalid !== -1) { setActive(invalid); setError(`Confira o treino ${blockLetter(invalid)}: informe nome e pelo menos um exercício com séries e repetições válidas.`); return; }
    setBusy(true);
    try {
      await api('/workout-sheets', { method: 'POST', body: { clientId: client?.id || null, title: title.trim(), notes: notes.trim() || null, sourceSheetId: source?.id || null, blocks: blocks.map(blockPayload) } });
      onSaved();
    } catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  return <section className="settings-section sheet-editor">
    <div className="section-heading"><div><h2>{client ? 'Montar ficha do aluno' : 'Modelo de ficha completa'}</h2><p>{source ? `Referência: ${source.title}. Os ajustes ficam nesta nova ficha.` : 'Combine modelos diferentes ou monte cada treino do zero.'}</p></div></div>
    {error && <p role="alert" className="catalog-error">{error}</p>}
    <form onSubmit={submit}><fieldset className="workout-editor-fields" disabled={busy}>
      <label className="field">Nome da ficha<input required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Hipertrofia — ciclo de novembro" /></label>
      <details className="block-notes"><summary>Orientações gerais da ficha</summary><label className="field"><span className="sr-only">Orientações gerais da ficha</span><textarea maxLength={5000} value={notes} onChange={(event) => setNotes(event.target.value)} /></label></details>
      <div className="sheet-toolbar"><button type="button" className="button button-outline" disabled={blocks.length >= 26} onClick={() => { setBlocks([...blocks, blockDraft(null, initialLevel)]); setActive(blocks.length); setPicker(null); }}><FiPlus />Treino vazio</button><button type="button" className="button button-outline" disabled={blocks.length >= 26} onClick={() => setPicker(picker === 'add' ? null : 'add')}><FiCopy />Adicionar modelo de bloco</button><span className="settings-count">{blocks.length} treino(s) nesta ficha</span></div>
      {picker === 'add' && <TemplatePicker templates={library.templates} onChoose={chooseTemplate} />}
      <div className="sheet-block-tabs" role="tablist" aria-label="Treinos da ficha">{blocks.map((item, index) => <button type="button" role="tab" id={`sheet-tab-${item.localId}`} aria-selected={active === index} aria-controls={`sheet-panel-${item.localId}`} className={active === index ? 'selected' : ''} key={item.localId} onClick={() => { setActive(index); setPicker(null); }}>Treino {blockLetter(index)}<small>{item.title || 'Sem nome'}</small></button>)}</div>
      <div className="sheet-block-editor" role="tabpanel" id={`sheet-panel-${block.localId}`} aria-labelledby={`sheet-tab-${block.localId}`}>
        <div className="sheet-block-heading"><h3>Treino {blockLetter(active)}</h3><div className="sheet-toolbar">
          <MoveButtons index={active} count={blocks.length} label={`treino ${blockLetter(active)}`} onMove={(direction) => { setBlocks(moveItem(blocks, active, direction)); setActive(active + direction); setPicker(null); }} />
          <button type="button" className="button button-outline" onClick={() => setPicker(picker === 'replace' ? null : 'replace')}>Substituir por modelo</button>
          <button type="button" className="button button-outline" disabled={blocks.length === 1} onClick={() => {
            if (!window.confirm(`Remover o treino ${blockLetter(active)} desta ficha?`)) return;
            setBlocks(blocks.filter((_, index) => index !== active)); setActive(Math.max(0, active - 1)); setPicker(null);
          }}><FiTrash2 />Remover bloco</button>
        </div></div>
        {picker === 'replace' && <TemplatePicker templates={library.templates} label="Substituir este bloco" onChoose={chooseTemplate} />}
        <BlockFields key={block.localId} block={block} onChange={updateBlock} exercises={exercises} />
      </div>
      <div className="form-actions"><button type="button" className="button button-outline" onClick={onClose}>Cancelar</button><button className="button button-primary">{busy ? 'Salvando…' : client ? 'Salvar ficha e definir como atual' : 'Salvar modelo de ficha'}</button></div>
    </fieldset></form>
  </section>;
}

