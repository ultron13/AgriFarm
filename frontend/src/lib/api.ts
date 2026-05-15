import type { ApiResponse } from '@/types';

const BASE = '/api/v1';

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
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
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    body,
    credentials: 'include',
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
