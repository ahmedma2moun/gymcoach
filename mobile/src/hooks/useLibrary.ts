import { useCallback } from 'react';
import { apiFetch } from '@/src/api/client';
import { useRemoteData } from './useRemoteData';
import type { LibraryExercise } from '@/src/types/api';

export function useLibrary() {
  const fetcher = useCallback(
    (signal: AbortSignal) => apiFetch<LibraryExercise[]>('/api/exercises', { signal }),
    [],
  );
  return useRemoteData(fetcher);
}
