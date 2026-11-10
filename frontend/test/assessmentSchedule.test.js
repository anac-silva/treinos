import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessmentInterval, nextAssessmentDate } from '../src/lib/assessmentSchedule.js';
test('assessment schedule handles month and year changes and manual dates', () => {
  assert.equal(nextAssessmentDate('2026-11-09', 90), '2027-02-07');
  assert.equal(assessmentInterval('2026-11-09', '2027-02-07'), 90);
  assert.equal(nextAssessmentDate('2028-02-28', 1), '2028-02-29');
  assert.equal(nextAssessmentDate('2026-11-09', ''), '');
  assert.equal(nextAssessmentDate('2026-11-09', -1), '');
});
