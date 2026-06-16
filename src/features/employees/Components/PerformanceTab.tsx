'use client';
import { usePerformance } from '../../performance/Hooks/usePerformance';
import { AppraisalCard } from '../../performance/Components/AppraisalCard';
import { Wrapper } from '@/components/custom-ui/Wrapper';

export function PerformanceTab({ employeeId }: { employeeId: string }) {
  const { records, loading, error, refetch } = usePerformance(employeeId);
  return (
    <Wrapper loading={loading} error={error} onRetry={refetch}>
      <div className="space-y-3">
        {records.length === 0 ? (
          <p className="text-sm text-foreground/50">No appraisal records.</p>
        ) : records.map((r) => <AppraisalCard key={r._id} record={r} />)}
      </div>
    </Wrapper>
  );
}
