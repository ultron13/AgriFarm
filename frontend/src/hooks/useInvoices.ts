import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  pdfUrl: string | null;
  total: number;
  issuedAt: string | null;
  dueDate: string | null;
}

export function useInvoice(orderId: string | null) {
  return useQuery({
    queryKey: ['invoice', orderId],
    queryFn: () => api.get<Invoice>(`/invoices/${orderId}`),
    enabled: !!orderId,
    refetchInterval: (query) => {
      // Poll until PDF is ready
      const status = query.state.data?.data?.status;
      return status === 'DRAFT' ? 5000 : false;
    },
  });
}

export function invoicePdfUrl(orderId: string): string {
  return `/api/v1/invoices/${orderId}/pdf`;
}
