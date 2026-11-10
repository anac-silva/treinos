import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessmentAge } from '../src/lib/assessmentAge.js';

test('counts calendar days in São Paulo including the 90-day boundary', () => {
  const now = new Date('2026-11-10T01:00:00Z');
  assert.equal(assessmentAge('2026-08-11', now), 90);
  assert.equal(assessmentAge('2026-08-10', now), 91);
  assert.equal(assessmentAge('2026-11-09', now), 0);
  assert.equal(assessmentAge(null, now), null);
});
