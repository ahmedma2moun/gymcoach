import { useCallback } from 'react';
import { apiFetch } from '@/src/api/client';
import { useRemoteData } from './useRemoteData';
import type { ExerciseHistory } from '@/src/types/api';

export function useExerciseHistory(userId: string | undefined) {
  const fetcher = useCallback(
    (signal: AbortSignal) => {
      if (!userId) return Promise.resolve<ExerciseHistory>({});
      return apiFetch<ExerciseHistory>(
        `/api/plans/user/${userId}/exercise-history`,
        { signal },
      );
    },
    [userId],
  );
  return useRemoteData(fetcher);
}
