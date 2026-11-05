import { useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useRemote } from '../src/lib/useRemote';

export default function Harness() {
  const [{ path, revision }, setQuery] = useState({ path: '/review/a', revision: 0 });
  const { data, loading, error } = useRemote(path, revision);
  useLayoutEffect(() => { window.reviewQuery = setQuery; window.reviewState = { data, loading, error }; }, [data, loading, error]);
  return <pre>{JSON.stringify({ data, loading, error })}</pre>;
}
createRoot(document.getElementById('root')).render(<Harness />);
