import { useCallback } from 'react';
import { apiFetch } from '@/src/api/client';
import { useRemoteData } from './useRemoteData';
import type { AuthUser } from '@/src/types/api';

export function useUsers() {
  const fetcher = useCallback(
    (signal: AbortSignal) => apiFetch<AuthUser[]>('/api/users', { signal }),
    [],
  );
  return useRemoteData(fetcher);
}
