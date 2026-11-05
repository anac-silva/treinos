export default function ExerciseList({ block }) {
  return <>{block.notes && <p className="workout-readable-notes">{block.notes}</p>}<ol className="sheet-exercises">{block.exercises.map((item) => <li key={item.id}><strong>{item.exercise.name}</strong><span>{item.sets} séries × {item.repetitions} repetições{item.restSeconds != null && ` · ${item.restSeconds}s de descanso`}</span>{item.notes && <small>{item.notes}</small>}</li>)}</ol></>;
}

