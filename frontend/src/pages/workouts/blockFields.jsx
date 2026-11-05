import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiTrash2, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { moveItem, workoutLevels } from '../../lib/workoutSheets';

export function MoveButtons({ index, count, onMove, label }) {
  return <span className="workout-move-actions">
    <button type="button" className="icon-button" aria-label={`Mover ${label} para cima`} disabled={index === 0} onClick={() => onMove(-1)}><FiArrowUp /></button>
    <button type="button" className="icon-button" aria-label={`Mover ${label} para baixo`} disabled={index === count - 1} onClick={() => onMove(1)}><FiArrowDown /></button>
  </span>;
}

export default function BlockFields({ block, onChange, exercises }) {
  const [selected, setSelected] = useState('');
  const update = (field, value) => onChange({ ...block, [field]: value });
  const updateExercise = (index, field, value) => update('exercises', block.exercises.map((item, position) => position === index ? { ...item, [field]: value } : item));
  return <div className="block-fields">
    <div className="block-metadata">
      <label className="field">Nome do treino<input required maxLength={100} value={block.title} onChange={(event) => update('title', event.target.value)} placeholder="Ex.: Superiores — costas e bíceps" /></label>
      <label className="field">Nível<select value={block.level} onChange={(event) => update('level', event.target.value)}>{workoutLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}</select></label>
      <label className="field">Foco<input maxLength={100} value={block.focus} onChange={(event) => update('focus', event.target.value)} placeholder="Ex.: Superiores, Inferiores, Corpo inteiro" /></label>
    </div>
    <details className="block-notes" open={block.notes ? true : undefined}><summary>Orientações deste treino</summary><label className="field"><span className="sr-only">Orientações do treino</span><textarea maxLength={5000} value={block.notes} onChange={(event) => update('notes', event.target.value)} /></label></details>
    <div className="workout-add-exercise">
      <label className="field">Adicionar exercício<select value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">Selecione um exercício</option>{exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}</select></label>
      <button type="button" className="button button-outline" disabled={!selected} onClick={() => {
        update('exercises', [...block.exercises, { localId: crypto.randomUUID(), exerciseId: selected, sets: '3', repetitions: '10', restSeconds: '60', notes: '' }]); setSelected('');
      }}><FiPlus /> Adicionar</button>
    </div>
    {!exercises.length && <p className="catalog-empty">Cadastre exercícios em <Link to="/configuracoes">Configurações</Link>.</p>}
    {!block.exercises.length && <p className="catalog-empty">Nenhum exercício neste treino. Adicione pelo menos um para salvar.</p>}
    <div className="workout-exercise-list">{block.exercises.map((item, index) => <article className="workout-exercise-card" key={item.localId}>
      <header><label className="field exercise-row-selector"><span className="sr-only">Exercício {index + 1}</span><select aria-label={`Exercício ${index + 1}`} value={item.exerciseId} onChange={(event) => updateExercise(index, 'exerciseId', event.target.value)}>{exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{index + 1}. {exercise.name}</option>)}</select></label><div className="workout-row-tools">
        <MoveButtons index={index} count={block.exercises.length} label={`exercício ${index + 1}`} onMove={(direction) => update('exercises', moveItem(block.exercises, index, direction))} />
        <button type="button" className="icon-button" aria-label={`Remover exercício ${index + 1}`} onClick={() => update('exercises', block.exercises.filter((_, position) => position !== index))}><FiTrash2 /></button>
      </div></header>
      <div className="workout-exercise-fields">
        <label className="field">Séries<input required type="number" min="1" max="30" value={item.sets} onChange={(event) => updateExercise(index, 'sets', event.target.value)} /></label>
        <label className="field">Repetições<input required maxLength={40} value={item.repetitions} onChange={(event) => updateExercise(index, 'repetitions', event.target.value)} /></label>
        <label className="field">Descanso (s)<input type="number" min="0" max="3600" value={item.restSeconds} onChange={(event) => updateExercise(index, 'restSeconds', event.target.value)} /></label>
        <label className="field">Observações<input maxLength={1000} value={item.notes} onChange={(event) => updateExercise(index, 'notes', event.target.value)} /></label>
      </div>
    </article>)}</div>
  </div>;
}
