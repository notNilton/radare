import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { ReconcilePayload, ReconcileResult } from '../types';

export function useReconcile() {
  return useMutation({
    mutationFn: (payload: ReconcilePayload) =>
      apiClient.post<ReconcileResult>('/reconcile', payload),
  });
}
