import { test } from 'node:test';
import assert from 'node:assert/strict';
import { businessDateTime, businessDateTimeToIso, businessDateKey, businessDayBounds, nextBusinessHour, shiftMonth, appointmentPeriod } from '../src/lib/businessDate.js';

test('agenda interpreta e edita o mesmo horário em diferentes fusos do dispositivo', () => {
  const original = process.env.TZ;
  try {
    for (const zone of ['America/Sao_Paulo', 'UTC', 'Asia/Tokyo', 'America/Los_Angeles']) {
      process.env.TZ = zone;
      const instant = businessDateTimeToIso('2026-11-04', '10:30');
      assert.equal(instant, '2026-11-04T13:30:00.000Z');
      assert.equal(businessDateTime(instant), '2026-11-04T10:30');
      assert.equal(businessDateKey('2026-11-05T01:00:00Z'), '2026-11-04');
    }
  } finally { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; }
});

test('limites do dia, virada do mês e período que termina no dia seguinte', () => {
  assert.equal(businessDayBounds('2026-11-04'), '2026-11-04T03:00:00.000Z');
  assert.equal(businessDayBounds('2026-11-04', true), '2026-11-05T02:59:59.999Z');
  assert.equal(nextBusinessHour('2026-11-05T02:40:00Z'), '2026-11-05T00:00');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(appointmentPeriod('2026-11-05T02:30:00Z', 60), 'Das 23h30 às 00h30 (dia seguinte)');
});
