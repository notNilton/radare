import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { LoginCredentials, LoginResponse } from '../types';

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      apiClient.post<LoginResponse>('/login', credentials, {
        authRedirect: false,
      }),
  });
}
