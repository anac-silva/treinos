import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentWeightPoints } from '../src/lib/currentWeight.js';
test('future assessments do not override the current weight; same-day readings retain order', () => {
  const items = [{ assessedOn: '2027-04-14', value: '80' }, { assessedOn: '2026-11-04', value: '90' }, { assessedOn: '2026-11-09', value: '75' }, { assessedOn: '2026-11-09', value: '74' }];
  assert.deepEqual(currentWeightPoints(items, new Date('2026-11-09T20:00:00Z')), [{ value: 90 }, { value: 75 }, { value: 74 }]);
});
