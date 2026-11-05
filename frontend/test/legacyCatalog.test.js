import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { importLegacyExercises, readLegacyExercises } from '../src/lib/legacyCatalog.js';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
test('importação explícita é repetível sem duplicar nomes equivalentes', async () => {
  const storage = { getItem: () => JSON.stringify({ exercises: [{ name: ' Agachamento ' }, { name: 'AGACHAMENTO' }, { name: 'Remada' }] }) };
  const rows = [{ name: 'Agachamento' }];
  let writes = 0;
  globalThis.fetch = async (_url, options) => {
    if (options.method === 'POST') { writes++; rows.push(JSON.parse(options.body)); return Response.json(rows.at(-1)); }
    return Response.json({ items: rows, total: rows.length });
  };
  assert.equal(readLegacyExercises(storage).length, 3);
  await importLegacyExercises(storage);
  await importLegacyExercises(storage);
  assert.equal(writes, 1);
  assert.equal(rows.length, 2);
});
test('dados legados inválidos não interrompem configurações', () => {
  assert.deepEqual(readLegacyExercises({ getItem: () => '{' }), []);
  assert.deepEqual(readLegacyExercises({ getItem: () => JSON.stringify({ exercises: [null, { name: '' }, { name: 123 }] }) }), []);
});
