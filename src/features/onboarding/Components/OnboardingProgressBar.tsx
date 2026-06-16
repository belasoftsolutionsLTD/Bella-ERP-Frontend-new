'use client';
export function OnboardingProgressBar({ percentage }: { percentage: number }) {
  const color = percentage === 100 ? 'bg-success' : percentage >= 50 ? 'bg-accent' : 'bg-primary/60';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-gray-100">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-xs font-medium w-9 text-right">{percentage}%</span>
    </div>
  );
}
