import type { ApiResponse } from '@/types';

const BASE = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('fc_token');
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const data = await res.json() as ApiResponse<T>;
  if (!res.ok && data.error) {
    throw new Error(data.error.message);
  }
  return data;
}

async function requestForm<T>(path: string, body: FormData): Promise<ApiResponse<T>> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json() as ApiResponse<T>;
  if (!res.ok && data.error) throw new Error(data.error.message);
  return data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  postForm: <T>(path: string, body: FormData) => requestForm<T>(path, body),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
