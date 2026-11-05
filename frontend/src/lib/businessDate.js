export const businessTimeZone = 'America/Sao_Paulo';

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: businessTimeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: businessTimeZone, hour: '2-digit', minute: '2-digit',
});
const dayFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: businessTimeZone, dateStyle: 'full' });

function partsOf(value) {
  return Object.fromEntries(partsFormatter.formatToParts(new Date(value))
    .filter(({ type }) => type !== 'literal').map(({ type, value: part }) => [type, part]));
}
export function businessDateKey(value = new Date()) {
  const { year, month, day } = partsOf(value);
  return `${year}-${month}-${day}`;
}
export function businessDateTime(value) {
  const parts = partsOf(value);
  return `${businessDateKey(value)}T${parts.hour}:${parts.minute}`;
}
export function businessTimeLabel(value) { return timeFormatter.format(new Date(value)); }
export function businessDayLabel(day) { return dayFormatter.format(new Date(`${day}T12:00:00Z`)); }

// Interpret the form's wall-clock time in the business zone, regardless of the device zone.
export function businessDateTimeToIso(day, time) {
  const wallTime = Date.parse(`${day}T${time}:00Z`);
  if (!Number.isFinite(wallTime) || new Date(wallTime).toISOString().slice(0, 16) !== `${day}T${time}`) {
    throw new Error('Informe uma data e horário válidos.');
  }
  let instant = wallTime;
  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = partsOf(instant);
    const actualWallTime = Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`);
    if (actualWallTime === wallTime) return new Date(instant).toISOString();
    instant += wallTime - actualWallTime;
  }
  throw new Error('Este horário não existe no fuso da agenda.');
}
export function nextBusinessHour(now = new Date()) {
  const instant = new Date(now);
  instant.setUTCMinutes(0, 0, 0);
  instant.setUTCHours(instant.getUTCHours() + 1);
  return businessDateTime(instant);
}
export function businessDayBounds(day, end = false) {
  const start = businessDateTimeToIso(day, end ? '23:59' : '00:00');
  return end ? new Date(Date.parse(start) + 59_999).toISOString() : start;
}
export function shiftMonth(month, delta) {
  const [year, number] = month.split('-').map(Number);
  return new Date(Date.UTC(year, number - 1 + delta, 1)).toISOString().slice(0, 7);
}
export function appointmentPeriod(startsAt, durationMinutes) {
  const end = new Date(Date.parse(startsAt) + durationMinutes * 60_000);
  const nextDay = businessDateKey(end) !== businessDateKey(startsAt);
  return `Das ${businessTimeLabel(startsAt).replace(':', 'h')} às ${businessTimeLabel(end).replace(':', 'h')}${nextDay ? ' (dia seguinte)' : ''}`;
}
