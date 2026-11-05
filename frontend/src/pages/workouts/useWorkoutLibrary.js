import { useState } from 'react';
import { useCollection } from '../../lib/useCollection';
import { useRemote } from '../../lib/useRemote';

export function useWorkoutLibrary(clientId) {
  const [revision, setRevision] = useState(0);
  const [filters, setFilters] = useState({ page: 1, q: '' });
  const templates = useCollection('/workouts?templatesOnly=true', revision);
  const params = new URLSearchParams({
    ...(clientId ? { clientId, isActive: 'false' } : { templatesOnly: 'true' }),
    view: 'summary', pageSize: '10', page: String(filters.page), q: filters.q,
  });
  const sheets = useRemote('/workout-sheets?' + params, revision);
  const current = useRemote(clientId ? '/workout-sheets?' + new URLSearchParams({ clientId, isActive: 'true', pageSize: '1' }) : null, revision);
  return {
    templates: templates.data || [], sheets: sheets.data?.items || [],
    current: current.data?.items[0] || null,
    loading: templates.loading || current.loading,
    error: templates.error || current.error,
    sheetsLoading: sheets.loading, sheetsError: sheets.error,
    total: sheets.data?.total || 0, page: filters.page, query: filters.q,
    setPage: (page) => setFilters((value) => ({ ...value, page })),
    setQuery: (q) => setFilters({ page: 1, q }),
    reload: () => setRevision((value) => value + 1),
  };
}
