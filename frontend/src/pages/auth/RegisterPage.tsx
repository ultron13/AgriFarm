import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  displayName: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  role: z.enum(['FARMER', 'BUYER']),
  password: z.string().min(8, 'Minimum 8 characters'),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'BUYER' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await registerUser(data);
      if (res.data) navigate('/');
    } catch (e) {
      setError('root', { message: (e as Error).message });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-700">FarmConnect</h1>
          <p className="text-gray-500 mt-1">Join the direct farm marketplace</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Create account</h2>

          {errors.root && (
            <div className="p-3 rounded-lg bg-red-50 text-sm text-red-700">{errors.root.message}</div>
          )}

          <div className="flex gap-2">
            {(['BUYER', 'FARMER'] as const).map((r) => (
              <label key={r} className="flex-1 cursor-pointer">
                <input type="radio" value={r} {...register('role')} className="sr-only peer" />
                <div className="border rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-700">
                  {r === 'BUYER' ? 'I buy produce' : 'I grow produce'}
                </div>
              </label>
            ))}
          </div>

          <Input label="Business / Farm name" error={errors.displayName?.message} {...register('displayName')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="WhatsApp number (optional)" type="tel" placeholder="+27 72 345 6789" {...register('phone')} />
          <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Create account
          </Button>

          <p className="text-center text-sm text-gray-500">
            Already registered?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
