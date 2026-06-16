'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('flex w-full items-center', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={index} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                  isCompleted && 'border-primary bg-primary text-white',
                  isActive && 'border-accent bg-accent text-white',
                  !isCompleted && !isActive && 'border-gray-300 bg-white text-gray-400'
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  'text-xs',
                  isActive && 'font-semibold text-accent',
                  isCompleted && 'text-primary',
                  !isCompleted && !isActive && 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mb-5 h-0.5 flex-1',
                  isCompleted ? 'bg-primary' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
