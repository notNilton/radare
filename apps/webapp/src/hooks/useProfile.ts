import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { queryKeys } from '../lib/query-keys';
import type { UserProfile } from '../types';

export interface PasswordUpdatePayload {
  current_password: string;
  new_password: string;
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.detail(),
    queryFn: () => apiClient.get<UserProfile>('/profile'),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nextUser: UserProfile) => apiClient.put('/profile/update', nextUser),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail() }),
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (payload: PasswordUpdatePayload) => apiClient.post('/profile/password', payload),
  });
}
