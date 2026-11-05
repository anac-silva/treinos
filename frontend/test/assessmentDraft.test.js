import test from 'node:test';
import assert from 'node:assert/strict';
import { assessmentDraftKey, readAssessmentDraft, writeAssessmentDraft, removeAssessmentDraft, clearBodyMeasurements } from '../src/lib/assessmentDraft.js';

function memoryStorage() {
  const items = new Map();
  return { getItem: (key) => items.get(key) ?? null, setItem: (key, value) => items.set(key, value), removeItem: (key) => items.delete(key) };
}

test('recupera o rascunho após reabrir e separa clientes, usuários e versões de correção', () => {
  const storage = memoryStorage();
  const key = assessmentDraftKey('user', 'client');
  const values = { assessedOn: '2026-11-03', weightKg: '80', nextAssessmentOn: '2027-01-11', notes: 'Observação', 'measure-waist': '0' };
  assert.equal(writeAssessmentDraft(storage, key, values), true);
  assert.deepEqual(readAssessmentDraft(storage, key), values);
  for (const other of [assessmentDraftKey('other', 'client'), assessmentDraftKey('user', 'other'), assessmentDraftKey('user', 'client', 'assessment', 1), assessmentDraftKey('user', 'client', 'assessment', 2)]) {
    assert.equal(readAssessmentDraft(storage, other), null);
  }
  removeAssessmentDraft(storage, key);
  assert.equal(readAssessmentDraft(storage, key), null);
});

test('limpar medidas preserva os demais campos e não recupera os valores apagados', () => {
  const storage = memoryStorage();
  const key = assessmentDraftKey('user', 'client');
  const values = { weightKg: '80', notes: 'Preservar', assessedOn: '2026-11-03', nextAssessmentOn: '2027-01-11', 'measure-arm': '35', 'measure-waist': '90' };
  const cleared = clearBodyMeasurements(values);
  assert.deepEqual(cleared, { ...values, 'measure-arm': '', 'measure-waist': '' });
  assert.equal(values['measure-arm'], '35');
  writeAssessmentDraft(storage, key, cleared);
  assert.deepEqual(readAssessmentDraft(storage, key), cleared);
});

test('dados inválidos e armazenamento indisponível não interrompem o formulário', () => {
  const storage = memoryStorage();
  for (const value of ['{', 'null', JSON.stringify({ version: 1, values: { weightKg: 80 } }), JSON.stringify({ version: 1, values: { unknown: 'x' } })]) {
    storage.setItem('key', value);
    assert.equal(readAssessmentDraft(storage, 'key'), null);
  }
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('blocked'); } };
  assert.equal(readAssessmentDraft(blocked, 'key'), null);
  assert.equal(writeAssessmentDraft(blocked, 'key', {}), false);
  assert.equal(writeAssessmentDraft(null, 'key', {}), false);
  assert.doesNotThrow(() => removeAssessmentDraft(blocked, 'key'));
});
