import { useState } from 'react';
import { api } from '../../lib/api';
import { blockDraft, blockPayload } from '../../lib/workoutSheets';
import BlockFields from './blockFields';

export default function BlockEditor({ source, editing, exercises, onClose, onSaved }) {
  const [block, setBlock] = useState(() => blockDraft(source));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      await api(editing ? `/workouts/${source.id}` : '/workouts', { method: editing ? 'PUT' : 'POST', body: blockPayload(block) });
      onSaved();
    } catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  return <section className="settings-section"><div className="section-heading"><div><h2>{editing ? 'Editar modelo de bloco' : source ? 'Duplicar modelo de bloco' : 'Novo modelo de bloco'}</h2><p>A letra A, B ou C será definida na ficha de cada aluno.</p></div></div>
    {error && <p role="alert" className="catalog-error">{error}</p>}
    <form onSubmit={submit}><fieldset className="workout-editor-fields" disabled={busy}><BlockFields block={block} onChange={setBlock} exercises={exercises} />
      <div className="form-actions"><button type="button" className="button button-outline" onClick={onClose}>Voltar</button><button className="button button-primary" disabled={!block.exercises.length}>{busy ? 'Salvando…' : 'Salvar modelo'}</button></div>
    </fieldset></form>
  </section>;
}
