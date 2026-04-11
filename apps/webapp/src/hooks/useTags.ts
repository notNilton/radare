import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { queryKeys } from '../lib/query-keys';
import type { Tag, TagDraft } from '../types';

export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags.list(),
    queryFn: () => apiClient.get<Tag[]>('/tags'),
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nextDraft: TagDraft) => apiClient.post('/tags/create', nextDraft),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tags.list() }),
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/tags/delete?id=${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tags.list() }),
  });
}
