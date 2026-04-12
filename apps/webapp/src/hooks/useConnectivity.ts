import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export interface ConnectorStatus {
  name: string;
  status: 'online' | 'offline';
  last_seen?: string;
}

export interface ConnectivityResponse {
  connectors: ConnectorStatus[];
}

export interface ExternalMapping {
  ID: number;
  tag_id: number;
  connector_type: 'mqtt' | 'influxdb' | 'manual';
  external_name: string;
  topic: string;
}

export interface CreateMappingPayload {
  tag_id: number;
  connector_type: 'mqtt' | 'influxdb' | 'manual';
  external_name: string;
  topic: string;
}

const CONNECTIVITY_KEY = ['connectivity', 'status'];
const MAPPINGS_KEY = ['ingest', 'mappings'];
const API_KEYS_KEY = ['ingest', 'api-keys'];

export function useConnectivityStatus() {
  return useQuery({
    queryKey: CONNECTIVITY_KEY,
    queryFn: () => apiClient.get<ConnectivityResponse>('/connectivity/status'),
    refetchInterval: 15_000,
  });
}

export function useExternalMappings() {
  return useQuery({
    queryKey: MAPPINGS_KEY,
    queryFn: () => apiClient.get<ExternalMapping[]>('/ingest/mappings'),
  });
}

export function useCreateMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMappingPayload) =>
      apiClient.post<ExternalMapping>('/ingest/mappings/create', payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: MAPPINGS_KEY }),
  });
}

export function useIngestValue() {
  return useMutation({
    mutationFn: ({ tagId, value }: { tagId: number; value: number }) =>
      apiClient.post('/ingest/values', { tag_id: tagId, value }),
  });
}

export interface ApiKey {
  id: number;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at?: string | null;
  revoked_at?: string | null;
}

export interface ApiKeyCreateResponse extends ApiKey {
  key: string;
}

export function useApiKeys() {
  return useQuery({
    queryKey: API_KEYS_KEY,
    queryFn: () => apiClient.get<ApiKey[]>('/api-keys'),
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string }) =>
      apiClient.post<ApiKeyCreateResponse>('/api-keys/create', payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: API_KEYS_KEY }),
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api-keys/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: API_KEYS_KEY }),
  });
}
