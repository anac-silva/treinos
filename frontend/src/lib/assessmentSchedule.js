export function assessmentInterval(from, to) {
  if (!from || !to) return '';
  const days = Math.round((Date.parse(to) - Date.parse(from)) / 86400000);
  return Number.isFinite(days) && days >= 0 ? days : '';
}

export function nextAssessmentDate(from, days) {
  if (!from || days === '' || !Number.isInteger(Number(days)) || Number(days) < 0 || Number(days) > 3650) return '';
  const date = new Date(Date.parse(from) + Number(days) * 86400000);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : '';
}
