export function assessmentDraftKey(userId, clientId, assessmentId = 'new', version = 1) {
  return `treinos:assessment-draft:v1:${userId}:${clientId}:${assessmentId}:${version}`;
}

export function readAssessmentDraft(storage, key) {
  try {
    const draft = JSON.parse(storage?.getItem(key) || 'null');
    if (!draft || draft.version !== 1 || !draft.values || Array.isArray(draft.values)) return null;
    const entries = Object.entries(draft.values);
    if (!entries.every(([name, value]) => /^(assessedOn|weightKg|nextAssessmentOn|notes|reason|measure-[\w-]+)$/.test(name) && typeof value === 'string')) return null;
    return Object.fromEntries(entries);
  } catch { return null; }
}

export function writeAssessmentDraft(storage, key, values) {
  try {
    if (!storage) return false;
    storage.setItem(key, JSON.stringify({ version: 1, values }));
    return true;
  } catch { return false; }
}

export function removeAssessmentDraft(storage, key) {
  try { storage?.removeItem(key); } catch { /* Saving the assessment must still succeed. */ }
}

export function clearBodyMeasurements(values) {
  return Object.fromEntries(Object.entries(values).map(([name, value]) => [name, name.startsWith('measure-') ? '' : value]));
}
