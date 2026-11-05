import { useCallback } from 'react';
import { api } from './api';
import { useAsyncResource } from './useAsyncResource';
export function useRemote(path, revision = 0) {
  const load = useCallback((signal) => api(path, { signal }), [path]);
  return useAsyncResource(path === null ? null : JSON.stringify([path, revision]), load);
}
