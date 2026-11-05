import test from 'node:test';
import assert from 'node:assert/strict';
import { blockDraft, blockPayload, blockLetter, moveItem, filterBlocks } from '../src/lib/workoutSheets.js';

test('copiar e ajustar blocos mantém modelos e outras cópias independentes', () => {
  const source = { id: 'template', title: 'Superiores', level: 'BASIC', focus: 'Costas e bíceps', exercises: [{ exerciseId: 'row', sets: 3, repetitions: '10', restSeconds: 0, notes: 'Postura' }] };
  const first = blockDraft(source);
  const second = blockDraft(source);
  first.title = 'Superiores ajustado';
  first.exercises[0].sets = '4';
  assert.equal(source.title, 'Superiores');
  assert.equal(source.exercises[0].sets, 3);
  assert.equal(second.exercises[0].sets, '3');
  assert.notEqual(first.localId, second.localId);
  assert.notEqual(first.exercises[0].localId, second.exercises[0].localId);
  const payload = blockPayload(first);
  assert.equal(payload.sourcePlanId, 'template');
  assert.equal(payload.exercises[0].sets, 4);
  assert.equal(payload.exercises[0].restSeconds, 0);
  assert.equal('localId' in payload, false);
  assert.equal('localId' in payload.exercises[0], false);
});

test('reordenar blocos ou exercícios preserva os dados e permite letras A a Z', () => {
  const blocks = [{ title: 'Superiores' }, { title: 'Inferiores' }, { title: 'Misto' }];
  const reordered = moveItem(blocks, 2, -1);
  assert.deepEqual(reordered.map((block) => block.title), ['Superiores', 'Misto', 'Inferiores']);
  assert.equal(blocks[1].title, 'Inferiores');
  assert.equal(moveItem(blocks, 0, -1), blocks);
  assert.equal(moveItem(blocks, 2, 1), blocks);
  assert.equal(blockLetter(0), 'A');
  assert.equal(blockLetter(25), 'Z');
});

test('busca modelos por foco e nível sem depender de acentuação', () => {
  const blocks = [{ title: 'Variação feminina', focus: 'Bíceps', level: 'BASIC' }, { title: 'Corpo inteiro', focus: 'Misto', level: 'ADVANCED' }];
  assert.equal(filterBlocks(blocks, { q: 'variacao', focus: 'biceps', level: 'BASIC' }).length, 1);
  assert.equal(filterBlocks(blocks, { level: 'ADVANCED' })[0].title, 'Corpo inteiro');
  assert.equal(filterBlocks(blocks, { q: 'nenhum' }).length, 0);
});
