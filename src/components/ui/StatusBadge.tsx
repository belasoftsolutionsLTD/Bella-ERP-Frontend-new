import { cn } from '@/lib/utils';
import { badgeVariants, type BadgeVariantKey } from '@/lib/design-tokens';

interface StatusBadgeProps {
  variant: BadgeVariantKey | string;
  label?: string;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ variant, label, className, dot = false }: StatusBadgeProps) {
  const style = badgeVariants[variant as BadgeVariantKey] ?? badgeVariants.default;
  const displayLabel = label ?? variant.replace(/-/g, ' ').replace(/_/g, ' ');

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize',
      style,
      className,
    )}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80 shrink-0" />}
      {displayLabel}
    </span>
  );
}

// Convenience re-export for common use cases
export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  return <StatusBadge variant={priority as BadgeVariantKey} className={className} />;
}

export function StageBadge({ stage, label, className }: { stage: string; label?: string; className?: string }) {
  return <StatusBadge variant={stage as BadgeVariantKey} label={label} className={className} />;
}
