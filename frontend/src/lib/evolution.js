// Keep the most recent reading of each measure for a given assessment day.
export function evolutionSeries(items, defaultUnit = 'kg') {
  const groups = new Map();
  for (const item of items) {
    const value = Number(item.value);
    if (item.value == null || item.value === '' || !Number.isFinite(value)) continue;
    const day = item.assessedOn.slice(0, 10);
    const key = `${item.typeId || 'weight'}:${item.unit || defaultUnit}`;
    if (!groups.has(key)) groups.set(key, { id: key, name: item.name || 'Peso', unit: item.unit || defaultUnit, days: new Map() });
    groups.get(key).days.set(day, { day, value });
  }
  return [...groups.values()].map(({ days, ...series }) => ({ ...series, points: [...days.values()].sort((a, b) => a.day.localeCompare(b.day)) }));
}
