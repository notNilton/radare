import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { queryKeys } from '../lib/query-keys';
import type { HistoryFilters, HistoryResponse } from '../types';

function buildHistorySearchParams(filters: HistoryFilters, page: number) {
  const searchParams = new URLSearchParams({ page: String(page + 1) });

  if (filters.status) {
    searchParams.set('status', filters.status);
  }
  if (filters.startDate) {
    searchParams.set('start_date', new Date(filters.startDate).toISOString());
  }
  if (filters.endDate) {
    searchParams.set('end_date', new Date(filters.endDate).toISOString());
  }

  return searchParams;
}

export function useHistory(filters: HistoryFilters) {
  const normalizedFilters = { ...filters, page: filters.page ?? 0 };

  return useQuery({
    queryKey: queryKeys.history.list(normalizedFilters),
    queryFn: () =>
      apiClient.get<HistoryResponse>(
        `/reconcile/history?${buildHistorySearchParams(normalizedFilters, normalizedFilters.page).toString()}`,
      ),
  });
}

export function useInfiniteHistory(filters: Omit<HistoryFilters, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['history', 'infinite', filters],
    queryFn: ({ pageParam = 0 }) =>
      apiClient.get<HistoryResponse>(
        `/reconcile/history?${buildHistorySearchParams(filters, pageParam as number).toString()}`,
      ),
    getNextPageParam: (lastPage, allPages) => {
      const itemsLoaded = allPages.flatMap((p) => p.data ?? []).length;
      const totalItems = lastPage.total ?? 0;
      return itemsLoaded < totalItems ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });
}

export function useExportHistory() {
  return useMutation({
    mutationFn: () => apiClient.getBlob('/reconcile/export'),
  });
}

export function useExportHistoryPdf() {
  return useMutation({
    mutationFn: () => apiClient.getBlob('/reconcile/export/pdf'),
  });
}
