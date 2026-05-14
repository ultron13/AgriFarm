import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SimulateResponse {
  reply: string;
}

interface ActiveSession {
  phone: string;
  buyerName: string | null;
  state: string;
  messages: number;
  lastAt: string;
}

export function useSimulateWhatsApp() {
  return useMutation({
    mutationFn: ({ phone, message }: { phone: string; message: string }) =>
      api.post<SimulateResponse>('/whatsapp/simulate', { phone, message }),
  });
}

export function useActiveSessions() {
  return useQuery({
    queryKey: ['whatsapp', 'sessions'],
    queryFn: () => api.get<ActiveSession[]>('/whatsapp/sessions'),
    refetchInterval: 15_000,
  });
}
