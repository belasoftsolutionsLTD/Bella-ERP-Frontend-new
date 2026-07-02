'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { CustomInput } from '@/components/custom-ui/CustomInput';
import { Button } from '@/components/ui/button';
import { Toaster } from 'sonner';
import { apiCallFunction } from '@/functions/apiCallFunction';
import { API_BASE_URL } from '@/configs/constants';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(4, 'Password required'),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const locale = useLocale();
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const submit = (data: FormValues) => apiCallFunction<any>({
    url: `${API_BASE_URL}/auth/register`,
    method: 'POST',
    data,
    thenFn: () => {
      router.push(`/${locale}/login`);
    },
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Toaster richColors position="top-right" />
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border bg-white shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="h-14 w-14 rounded-xl bg-primary mx-auto flex items-center justify-center mb-4">
              <span className="text-accent font-bold text-xl">SE</span>
            </div>
            <h1 className="text-2xl font-bold text-primary">Bella ERP</h1>
            <p className="text-sm text-foreground/50 mt-1">Create your account</p>
          </div>
          <form onSubmit={handleSubmit(submit)} className="space-y-4">
            <CustomInput component="text" name="name" control={control} label="Full Name" placeholder="John Doe" />
            <CustomInput component="email" name="email" control={control} label="Email" placeholder="you@school.ac.ke" />
            <CustomInput component="password" name="password" control={control} label="Password" />
            <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white h-11">
              {isSubmitting ? 'Creating account...' : 'Register'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-foreground/50">
            Already have an account?{' '}
            <Link href={`/${locale}/login`} className="text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
