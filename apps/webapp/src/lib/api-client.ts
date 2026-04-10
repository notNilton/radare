import { API_URL } from '../config/env';
import { useAuthStore } from '../store/AuthStore';

type ResponseType = 'blob' | 'json' | 'text';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  authRedirect?: boolean;
  body?: BodyInit | object | null;
  responseType?: ResponseType;
}

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function buildUrl(path: string) {
  const base = API_URL.replace(/\/$/, '');
  const segment = path.replace(/^\//, '');
  return `${base}/${segment}`;
}

function extractMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}

async function parseResponse(response: Response, responseType: ResponseType) {
  if (responseType === 'blob') {
    return response.blob();
  }

  if (responseType === 'text') {
    return response.text();
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const {
    authRedirect = true,
    body,
    headers,
    responseType = 'json',
    ...init
  } = options;

  const token = useAuthStore.getState().token;
  const requestHeaders = new Headers(headers);

  if (body && !(body instanceof FormData) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (!requestHeaders.has('Accept') && responseType === 'json') {
    requestHeaders.set('Accept', 'application/json');
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers: requestHeaders,
    body:
      body && !(body instanceof FormData) && typeof body === 'object'
        ? JSON.stringify(body)
        : (body ?? undefined),
  });

  const payload = await parseResponse(response, responseType);

  if (response.status === 401 && authRedirect) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new ApiError(
      extractMessage(payload, 'Nao foi possivel completar a requisicao.'),
      response.status,
      payload,
    );
  }

  return payload as T;
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

export const apiClient = {
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
  get: <T>(path: string, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  getBlob: (path: string, options?: Omit<RequestOptions, 'method' | 'responseType'>) =>
    request<Blob>(path, { ...options, method: 'GET', responseType: 'blob' }),
  post: <T>(path: string, body?: RequestOptions['body'], options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: RequestOptions['body'], options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),
};
