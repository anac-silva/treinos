import { api, allPages } from './api.js';

const key = 'personal-trainer.catalog.v1';
const nameKey = (name) => name.trim().normalize('NFKC').toLocaleLowerCase('pt-BR');

export function readLegacyExercises(storage) {
  try {
    const exercises = JSON.parse(storage.getItem(key) || '{}')?.exercises;
    return Array.isArray(exercises) ? exercises.filter((item) => typeof item?.name === 'string' && item.name.trim()) : [];
  } catch { return []; }
}

// Explicit migration; mounting a provider never writes business records.
export async function importLegacyExercises(storage) {
  const existing = await allPages('/exercises');
  const names = new Set(existing.map((item) => nameKey(item.name)));
  for (const item of readLegacyExercises(storage)) {
    const normalized = nameKey(item.name);
    if (names.has(normalized)) continue;
    try { await api('/exercises', { method: 'POST', body: { name: item.name.trim() } }); }
    catch (error) { if (error.status !== 409) throw error; }
    names.add(normalized);
  }
}
