'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WrapperProps {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function Wrapper({ loading = false, error = null, onRetry, children }: WrapperProps) {
  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
        <p className="text-danger">{error}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
