'use client';
import { JobPositionCard } from './JobPositionCard';
import type { JobPosition } from '../Hooks/useJobPositions';

interface Props {
  positions: JobPosition[];
  onEdit?: (position: JobPosition) => void;
  onDelete?: (position: JobPosition) => void;
}

export function JobPositionsBoard({ positions, onEdit, onDelete }: Props) {
  if (positions.length === 0) return <p className="text-sm text-foreground/50">No positions found.</p>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {positions.map((p) => (
        <JobPositionCard key={p._id} position={p} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
