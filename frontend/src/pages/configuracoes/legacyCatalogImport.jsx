import { useState } from 'react';
import { useCatalog } from '../../contexts/catalogContext';
import { importLegacyExercises, readLegacyExercises } from '../../lib/legacyCatalog';

export default function LegacyCatalogImport() {
  const { reload } = useCatalog();
  const [available] = useState(() => {
    try { return readLegacyExercises(window.localStorage).length > 0; } catch { return false; }
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  if (!available) return null;
  async function migrate() {
    setBusy(true); setError(''); setMessage('');
    try { await importLegacyExercises(window.localStorage); reload(); setMessage('Exercícios antigos importados. Cadastros existentes foram preservados.'); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <section className="settings-section"><h2>Exercícios salvos neste navegador</h2>
    <p>Importe os cadastros antigos para disponibilizá-los no sistema.</p>
    <button type="button" className="button button-outline" disabled={busy} onClick={migrate}>{busy ? 'Importando…' : 'Importar exercícios antigos'}</button>
    {message && <p role="status">{message}</p>}{error && <p role="alert" className="catalog-error">{error}</p>}
  </section>;
}
