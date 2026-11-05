export const workoutInclude = {
  client: { select: { id: true, name: true, status: true } },
  sourcePlan: { select: { id: true, title: true, level: true } },
  exercises: { include: { exercise: { select: { id: true, name: true } } }, orderBy: { position: 'asc' as const } },
};
