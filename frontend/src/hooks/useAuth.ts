import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { saveAuth, getAuth, clearAuth } from '@/lib/auth';
import type { AuthUser } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getAuth);
  const navigate = useNavigate();

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<AuthUser>('/auth/login', { email, password });
    if (res.data) {
      saveAuth(res.data);
      setUser(res.data);
    }
    return res;
  }, []);

  const register = useCallback(async (payload: { email: string; password: string; role: string; displayName: string; phone?: string }) => {
    const res = await api.post<AuthUser>('/auth/register', payload);
    if (res.data) {
      saveAuth(res.data);
      setUser(res.data);
    }
    return res;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    navigate('/login');
  }, [navigate]);

  return { user, login, register, logout, isAuthenticated: !!user };
}
