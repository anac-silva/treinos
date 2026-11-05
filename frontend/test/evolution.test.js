import test from 'node:test';
import assert from 'node:assert/strict';
import { evolutionSeries } from '../src/lib/evolution.js';

test('evolução mantém a última leitura do dia e ordena as datas', () => {
  const result = evolutionSeries([
    { assessedOn: '2026-10-28', value: '80' },
    { assessedOn: '2026-10-28', value: '90' },
    { assessedOn: '2026-10-01', value: '95' },
  ]);
  assert.deepEqual(result[0].points, [{ day: '2026-10-01', value: 95 }, { day: '2026-10-28', value: 90 }]);
});

test('evolução separa tipos e unidades, preserva zero e ignora valores inválidos', () => {
  const result = evolutionSeries([
    { typeId: 'waist', name: 'Cintura', unit: 'cm', assessedOn: '2026-10-28', value: '75' },
    { typeId: 'waist', name: 'Cintura', unit: 'm', assessedOn: '2026-10-28', value: '.75' },
    { typeId: 'arm', name: 'Braço', unit: 'cm', assessedOn: '2026-10-28', value: '0' },
    { assessedOn: '2026-10-28', value: 'invalid' },
    { assessedOn: '2026-10-28', value: null },
  ]);
  assert.equal(result.length, 3);
  assert.deepEqual(result.map(({ unit }) => unit), ['cm', 'm', 'cm']);
  assert.equal(result[2].points[0].value, 0);
  assert.deepEqual(evolutionSeries([]), []);
});
