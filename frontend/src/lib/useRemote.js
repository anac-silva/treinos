import { useEffect, useState } from 'react';
import { api } from './api';
export function useRemote(path, revision = 0) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  useEffect(() => {
    const controller = new AbortController();
    api(path, { signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted) setState({ data, loading: false, error: '' });
    }).catch((error) => { if (!controller.signal.aborted) setState({ data: null, loading: false, error: error.message }); });
    return () => controller.abort();
  }, [path, revision]);
  // Remount callers when their resource changes to avoid showing another client's data.
  return state;
}
