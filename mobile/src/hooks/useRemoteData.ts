import { useCallback, useEffect, useRef, useState } from 'react';

type State<T> = {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
};

export function useRemoteData<T>(fetchFn: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<State<T>>({
    data: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (refreshing = false) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setState((s) => ({ ...s, isLoading: !refreshing, isRefreshing: refreshing, error: null }));
      try {
        const data = await fetchFn(ctrl.signal);
        if (!ctrl.signal.aborted)
          setState({ data, isLoading: false, isRefreshing: false, error: null });
      } catch (e: any) {
        if (!ctrl.signal.aborted)
          setState((s) => ({ ...s, isLoading: false, isRefreshing: false, error: e.message }));
      }
    },
    [fetchFn],
  );

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  return { ...state, refresh: () => load(true), reload: () => load(false) };
}
