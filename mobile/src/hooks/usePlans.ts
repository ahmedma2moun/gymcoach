import { useCallback } from 'react';
import { apiFetch } from '@/src/api/client';
import { useRemoteData } from './useRemoteData';
import type { Plan } from '@/src/types/api';

export function usePlans(userId: string | undefined) {
  const fetcher = useCallback(
    (signal: AbortSignal) => {
      if (!userId) return Promise.resolve<Plan[]>([]);
      return apiFetch<Plan[]>(`/api/plans/${userId}`, { signal });
    },
    [userId],
  );
  return useRemoteData(fetcher);
}
