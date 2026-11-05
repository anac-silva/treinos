export const workoutLevels = [{ value: 'BASIC', label: 'Básico' }, { value: 'INTERMEDIATE', label: 'Intermediário' }, { value: 'ADVANCED', label: 'Avançado' }];
export const blockLetter = (index) => String.fromCharCode(65 + index);

export function blockDraft(source, level = 'BASIC') {
  return {
    localId: crypto.randomUUID(), title: source?.title || '', level: source?.level || level,
    focus: source?.focus || '', notes: source?.notes || '', sourcePlanId: source?.id || null,
    exercises: (source?.exercises || []).map((item) => ({
      localId: crypto.randomUUID(), exerciseId: item.exerciseId, sets: String(item.sets),
      repetitions: item.repetitions, restSeconds: item.restSeconds == null ? '' : String(item.restSeconds), notes: item.notes || '',
    })),
  };
}

export function blockPayload(block) {
  return {
    title: block.title.trim(), level: block.level, focus: block.focus.trim() || null,
    notes: block.notes.trim() || null, sourcePlanId: block.sourcePlanId || null,
    exercises: block.exercises.map((item) => ({
      exerciseId: item.exerciseId, sets: Number(item.sets), repetitions: item.repetitions.trim(),
      restSeconds: item.restSeconds === '' ? null : Number(item.restSeconds), notes: item.notes.trim() || null,
    })),
  };
}

export function moveItem(items, index, direction) {
  const destination = index + direction;
  if (destination < 0 || destination >= items.length) return items;
  const result = [...items];
  [result[index], result[destination]] = [result[destination], result[index]];
  return result;
}

export function filterBlocks(blocks, { q = '', level = '', focus = '' }) {
  const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return blocks.filter((block) => (!level || block.level === level)
    && (!focus || normalize(block.focus || '').includes(normalize(focus)))
    && normalize(`${block.title} ${block.focus || ''}`).includes(normalize(q)));
}
