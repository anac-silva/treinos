export function currentWeightPoints(items, now = new Date()) {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(now);
  return items.filter((item) => item.assessedOn.slice(0, 10) <= today && item.value != null && item.value !== '' && Number.isFinite(Number(item.value)))
    .sort((a, b) => a.assessedOn.localeCompare(b.assessedOn))
    .map((item) => ({ value: Number(item.value) }));
}
