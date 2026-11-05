import { useEffect, useMemo, useState } from 'react';

const pending = { data: null, loading: true, error: '' };
const idle = { data: null, loading: false, error: '' };

// A result belongs to its request key; a different resource never inherits it.
export function useAsyncResource(key, load) {
  const request = useMemo(() => ({ key, load }), [key, load]);
  const [state, setState] = useState(null);
  useEffect(() => {
    if (request.key === null) return;
    const controller = new AbortController();
    Promise.resolve().then(() => {
      controller.signal.throwIfAborted();
      return request.load(controller.signal);
    }).then((data) => {
      if (!controller.signal.aborted) setState({ request, data, loading: false, error: '' });
    }).catch((error) => {
      if (!controller.signal.aborted) setState({ request, data: null, loading: false, error: error.message });
    });
    return () => controller.abort();
  }, [request]);
  if (key === null) return idle;
  return state?.request === request ? state : pending;
}
