import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const schema = z.object({
  orderId: z.string().uuid('Valid order ID required'),
  farmerId: z.string().uuid('Valid farmer ID required'),
  gradeAwarded: z.enum(['A', 'B', 'C', 'REJECTED']),
  quantityKg: z.coerce.number().positive('Must be positive'),
  rejectedKg: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function QualityCheckPage() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gradeAwarded: 'B', rejectedKg: 0 },
  });

  const submit = useMutation({
    mutationFn: (data: FormData) => api.post('/quality-checks', { ...data, photos: ['placeholder-r2-key'] }),
    onSuccess: () => { alert('Quality check submitted'); reset(); },
  });

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Quality Check</h1>
      <p className="text-gray-500 text-sm mb-6">Submit at collection point — minimum 3 photos required</p>

      <Card>
        <form onSubmit={handleSubmit((data) => submit.mutate(data))} className="space-y-4">
          <Input label="Order ID" error={errors.orderId?.message} {...register('orderId')} placeholder="uuid" />
          <Input label="Farmer ID" error={errors.farmerId?.message} {...register('farmerId')} placeholder="uuid" />

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Grade Awarded</label>
            <div className="flex gap-2">
              {(['A', 'B', 'C', 'REJECTED'] as const).map((g) => (
                <label key={g} className="flex-1 cursor-pointer">
                  <input type="radio" value={g} {...register('gradeAwarded')} className="sr-only peer" />
                  <div className={`border rounded-lg px-2 py-2 text-center text-xs font-semibold transition-colors peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-700 ${g === 'REJECTED' ? 'peer-checked:border-red-400 peer-checked:bg-red-50 peer-checked:text-red-700' : ''}`}>
                    {g}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Input label="Quantity (kg)" type="number" error={errors.quantityKg?.message} {...register('quantityKg')} className="flex-1" />
            <Input label="Rejected (kg)" type="number" {...register('rejectedKg')} className="flex-1" />
          </div>

          <Input label="Notes (optional)" {...register('notes')} placeholder="e.g. Minor surface blemishes on 2% of load" />

          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-400">
            Photo upload — minimum 3 photos
            <br />
            <span className="text-xs">(Cloudflare R2 signed URL upload — Phase 1)</span>
          </div>

          {submit.error && (
            <div className="p-3 rounded-lg bg-red-50 text-sm text-red-700">{(submit.error as Error).message}</div>
          )}

          <Button type="submit" className="w-full" loading={isSubmitting || submit.isPending}>
            Submit Quality Check
          </Button>
        </form>
      </Card>
    </div>
  );
}
