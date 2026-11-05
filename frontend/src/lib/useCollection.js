import { useCallback } from 'react';
import { allPages } from './api';
import { useAsyncResource } from './useAsyncResource';

// Use only for bounded collections such as a month's appointments or a catalog.
export function useCollection(path, revision = 0) {
  const load = useCallback((signal) => allPages(path, signal), [path]);
  return useAsyncResource(path === null ? null : JSON.stringify([path, revision]), load);
}
