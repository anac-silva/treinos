import { useParams } from 'react-router-dom';
import { useCatalog } from '../../contexts/catalogContext';
import { useWorkoutLibrary } from './useWorkoutLibrary';
import ClientWorkspace from './clientWorkspace';
import WorkoutLibrary from './workoutLibrary';
import './workoutSheets.css';

function WorkoutWorkspaceContent({ clientId }) {
  const library = useWorkoutLibrary(clientId);
  const { exercises, exerciseLoading, exerciseError } = useCatalog();
  if (library.loading || exerciseLoading) return <main className="workspace" role="status">Carregando biblioteca de treinos…</main>;
  if (library.error || exerciseError) return <main className="workspace"><p role="alert" className="catalog-error">{library.error || exerciseError}</p><button type="button" className="button button-outline" onClick={library.reload}>Tentar novamente</button></main>;
  return clientId ? <ClientWorkspace key={clientId} clientId={clientId} library={library} exercises={exercises} /> : <WorkoutLibrary library={library} exercises={exercises} />;
}

export default function WorkoutWorkspace() {
  const { clientId } = useParams();
  return <WorkoutWorkspaceContent key={clientId || 'library'} clientId={clientId} />;
}
