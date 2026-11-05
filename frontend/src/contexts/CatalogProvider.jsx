import { useState } from 'react';
import { CatalogContext } from './catalogContext';
import { api } from '../lib/api';
import { useCollection } from '../lib/useCollection';

export default function CatalogProvider({ children }) {
  const [revision, setRevision] = useState(0);
  const exercises = useCollection('/exercises', revision);
  const measurements = useCollection('/measurement-types', revision);
  const reload = () => setRevision((value) => value + 1);
  async function register(kind, values) {
    const name = values.name.trim();
    if (!name || name.length > 100) return 'Informe um nome de até 100 caracteres.';
    const unit = kind === 'measurements' ? values.unit?.trim() : undefined;
    if (kind === 'measurements' && (!unit || unit.length > 20)) return 'Informe uma unidade de até 20 caracteres.';
    try {
      await api(kind === 'measurements' ? '/measurement-types' : '/exercises', { method: 'POST', body: { name, ...(unit ? { unit } : {}) } });
      reload();
      return null;
    } catch (error) { return error.message; }
  }
  async function updateMeasurement(id, body) {
    await api('/measurement-types/' + id, { method: 'PATCH', body });
    reload();
  }
  return <CatalogContext.Provider value={{
    exercises: exercises.data || [], measurements: measurements.data || [],
    exerciseLoading: exercises.loading, exerciseError: exercises.error,
    loading: measurements.loading, error: measurements.error,
    register, updateMeasurement, reload,
  }}>{children}</CatalogContext.Provider>;
}
