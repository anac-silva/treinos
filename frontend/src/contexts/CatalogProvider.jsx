import { useEffect, useState } from 'react';
import { CatalogContext } from './catalogContext';
import { api, allPages } from '../lib/api';
const key = 'personal-trainer.catalog.v1';
function loadExercises() {
  try {
    const values = JSON.parse(localStorage.getItem(key))?.exercises;
    if (Array.isArray(values) && values.every((x) => typeof x.id === 'string' && typeof x.name === 'string')) return values;
  } catch { /* Storage indisponível. */ }
  return [];
}
export default function CatalogProvider({ children }) {
  const [exercises, setExercises] = useState(loadExercises);
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    allPages('/measurement-types', controller.signal).then((items) => {
      if (!controller.signal.aborted) { setMeasurements(items); setError(''); setLoading(false); }
    }).catch((error) => { if (!controller.signal.aborted) { setError(error.message); setLoading(false); } });
    return () => controller.abort();
  }, [revision]);
  async function register(kind, values) {
    const name = values.name.trim();
    if (!name || name.length > 100) return 'Informe um nome de até 100 caracteres.';
    if (kind === 'measurements') {
      const unit = values.unit?.trim();
      if (!unit || unit.length > 20) return 'Informe uma unidade de até 20 caracteres.';
      try {
        const item = await api('/measurement-types', { method: 'POST', body: { name, unit } });
        setMeasurements((items) => [...items, item]); return null;
      } catch (error) { return error.message; }
    }
    if (exercises.some((item) => item.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'))) return 'Já existe um exercício com esse nome.';
    const next = [...exercises, { id: crypto.randomUUID(), name }];
    try { localStorage.setItem(key, JSON.stringify({ exercises: next })); } catch { return 'Não foi possível salvar neste navegador.'; }
    setExercises(next); return null;
  }
  async function updateMeasurement(id, body) {
    const item = await api('/measurement-types/' + id, { method: 'PATCH', body });
    setMeasurements((items) => items.map((type) => type.id === id ? item : type));
  }
  return <CatalogContext.Provider value={{ exercises, measurements, register, updateMeasurement, loading, error, reload: () => setRevision((value) => value + 1) }}>{children}</CatalogContext.Provider>;
}
