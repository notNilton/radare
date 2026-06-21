import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { WorkspaceFlowData } from '../types';

export interface WorkspaceVersion {
  id: number;
  workspace_id: number;
  created_at: string;
  label?: string;
  data: WorkspaceFlowData;
}

const VERSIONS_KEY = (workspaceId: number) => ['workspaces', workspaceId, 'versions'] as const;

export function useWorkspaceVersions(workspaceId: number | null) {
  return useQuery<WorkspaceVersion[]>({
    queryKey: VERSIONS_KEY(workspaceId ?? 0),
    queryFn: () => apiClient.get<WorkspaceVersion[]>(`/workspaces/${workspaceId}/versions`),
    enabled: workspaceId !== null && workspaceId > 0,
    staleTime: 30_000,
  });
}

export function useCreateWorkspaceVersion() {
  return useMutation({
    mutationFn: ({ workspaceId, label }: { workspaceId: number; label?: string }) =>
      apiClient.post<WorkspaceVersion>(`/workspaces/${workspaceId}/versions`, { label }),
  });
}
