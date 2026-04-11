import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { queryKeys } from '../lib/query-keys';
import type { Workspace, WorkspacePayload } from '../types';

export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspaces.list(),
    queryFn: () => apiClient.get<Workspace[]>('/workspaces'),
  });
}

export function useWorkspace(id: number | null) {
  return useQuery({
    enabled: id !== null,
    queryKey: queryKeys.workspaces.detail(id ?? 0),
    queryFn: () => apiClient.get<Workspace>(`/workspaces/${id}`),
  });
}

export function useSaveWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WorkspacePayload) => apiClient.post<Workspace>('/workspaces', payload),
    onSuccess: (workspace) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.list() }),
        queryClient.setQueryData(queryKeys.workspaces.detail(workspace.ID), workspace),
      ]),
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/workspaces/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.list() }),
  });
}
