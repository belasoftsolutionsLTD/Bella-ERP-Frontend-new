'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { CustomInput } from '@/components/custom-ui/CustomInput';
import { Button } from '@/components/ui/button';
import { useCandidates } from '../Hooks/useCandidates';
import { CreateCandidateSchema, type CreateCandidateFormValues } from '../schemas';

export function AddCandidateModal({ onClose }: { onClose: () => void }) {
  const { createCandidate } = useCandidates();
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<CreateCandidateFormValues>({
    resolver: zodResolver(CreateCandidateSchema),
    defaultValues: { firstName: '', lastName: '', email: '', source: 'sourced', tags: [], isPassiveTalent: true },
  });

  const onSubmit = async (values: CreateCandidateFormValues) => {
    const result = await createCandidate(values);
    if (result) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Add Candidate</h2>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <CustomInput component="text" name="firstName" control={control} label="First Name" />
            <CustomInput component="text" name="lastName" control={control} label="Last Name" />
          </div>
          <CustomInput component="email" name="email" control={control} label="Email" />
          <CustomInput component="text" name="phone" control={control} label="Phone" />
          <CustomInput component="select" name="source" control={control} label="Source" options={[
            { value: 'careerSite', label: 'Career Site' }, { value: 'referral', label: 'Referral' },
            { value: 'agency', label: 'Agency' }, { value: 'sourced', label: 'Sourced' }, { value: 'inbound', label: 'Inbound' },
          ]} />
          <Button type="submit" disabled={isSubmitting} className="bg-primary text-white w-full">
            {isSubmitting ? 'Saving...' : 'Add Candidate'}
          </Button>
        </form>
      </div>
    </div>
  );
}
