export function assessmentAge(assessedOn, now = new Date()) {
  if (!assessedOn) return null;
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(now);
  return Math.max(0, Math.round((Date.parse(today) - Date.parse(assessedOn.slice(0, 10))) / 86400000));
}
