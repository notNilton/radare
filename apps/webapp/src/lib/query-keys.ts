export const queryKeys = {
  dashboard: {
    stats: () => ['dashboard', 'stats'] as const,
  },
  history: {
    list: (filters: {
      endDate: string;
      page: number;
      startDate: string;
      status: string;
    }) => ['history', filters] as const,
  },
  profile: {
    detail: () => ['profile'] as const,
  },
  tags: {
    list: () => ['tags'] as const,
  },
  workspaces: {
    list: () => ['workspaces'] as const,
    detail: (id: number) => ['workspaces', id] as const,
  },
};
